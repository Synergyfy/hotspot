export declare function getServiceToken(audience: string, scope?: string): Promise<string>;
export declare function callPeer<T>(peerBaseUrl: string, targetAudience: string, path: string, options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}): Promise<T>;
export declare function getDelegatedUserToken(userSsoAccessToken: string, targetAudience: string, scope?: string): Promise<string>;
