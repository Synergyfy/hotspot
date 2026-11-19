export declare class UploadsController {
    uploadFile(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
