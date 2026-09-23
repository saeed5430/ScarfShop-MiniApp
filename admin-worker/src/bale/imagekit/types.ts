export interface BaleImageKitConfig {
  privateKey: string;
  publicKey: string;
  urlEndpoint: string;
}

export interface BaleImageUploadResult {
  url: string;
  fileId: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  fileType?: string;
}

export interface BaleUploadOptions {
  folder?: string;
  fileName?: string;
  useUniqueFileName?: boolean;
}
