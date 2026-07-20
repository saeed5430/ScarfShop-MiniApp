export interface ImageKitConfig {
  privateKey: string;
  publicKey: string;
  urlEndpoint: string;
}

export interface ImageUploadResult {
  url: string;
  fileId: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  fileType?: string;
}

export interface ImageKitError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  useUniqueFileName?: boolean;
  tags?: string[];
  transformation?: {
    pre?: string;
    post?: Array<{
      type: string;
      value: string;
    }>;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
