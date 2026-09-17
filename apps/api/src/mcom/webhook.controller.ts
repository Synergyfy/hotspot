import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { McomService } from './mcom.service';
import { UsersService } from '../users/users.service';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private processedWebhooks = new Set<string>();
  private readonly MAX_PROCESSED = 1000;

  constructor(
    private mcomService: McomService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const rawBody = JSON.stringify(req.body);
      const signature = req.headers['x-webhook-signature'] as string;

      if (!signature) {
        this.logger.warn('Webhook received without signature');
        return res.status(401).json({ error: 'Missing signature' });
      }

      // Verify HMAC signature
      const webhookSecret = this.configService.get<string>('MCOM_WEBHOOK_SECRET');
      if (!webhookSecret) {
        this.logger.error('MCOM_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
      ) {
        this.logger.warn('Webhook signature mismatch');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Deduplicate by body hash
      const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
      if (this.processedWebhooks.has(bodyHash)) {
        this.logger.log('Duplicate webhook received, skipping');
        return res.status(200).json({ success: true, duplicate: true });
      }

      // Add to processed set and cleanup if needed
      this.processedWebhooks.add(bodyHash);
      if (this.processedWebhooks.size > this.MAX_PROCESSED) {
        const firstEntry = this.processedWebhooks.values().next().value;
        this.processedWebhooks.delete(firstEntry);
      }

      // Process webhook event
      const { event, data } = req.body;
      await this.processEvent(event, data);

      return res.status(200).json({ success: true });
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async processEvent(event: string, data: any) {
    const { userId, package: pkg, status } = data;

    this.logger.log(`Processing webhook event: ${event}`);

    const user = await this.usersService.findByMcomUserId(userId);
    if (!user) {
      this.logger.warn(`User not found for MCOM user ID: ${userId}`);
      return;
    }

    switch (event) {
      case 'package.created':
      case 'package.renewed':
        await this.usersService.updateMcomFields(user.id, {
          mcomMembershipStatus: 'active',
          mcomMembershipLevel: pkg?.level || user.mcomMembershipLevel,
          mcomMembershipTier: pkg?.tier || user.mcomMembershipTier,
          mcomCanAccessVcard: true,
        });
        this.logger.log(`Membership activated for user ${user.id}`);
        break;

      case 'package.cancelled':
      case 'package.expired':
        await this.usersService.updateMcomFields(user.id, {
          mcomMembershipStatus: 'inactive',
          mcomCanAccessVcard: false,
        });
        this.logger.log(`Membership deactivated for user ${user.id}`);
        break;

      case 'payment.failed':
        this.logger.warn(`Payment failed for user ${user.id}: ${JSON.stringify(data)}`);
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${event}`);
    }
  }
}