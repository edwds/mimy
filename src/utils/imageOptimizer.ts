/**
 * Optimizes an image file by resizing and compressing it.
 * 
 * @param file The original image file
 * @param maxWidth The maximum width/height allowed (default: 1200px)
 * @param quality The image quality from 0 to 1 (default: 0.8)
 * @returns A promise that resolves to the optimized File object
 */
export const optimizeImage = (
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.8
): Promise<File> => {
    return new Promise((resolve, reject) => {
        // If not an image, return original
        if (!file.type.match(/image.*/)) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions if image is larger than maxWidth
                if (width > maxWidth || height > maxWidth) {
                    if (width > height) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    } else {
                        width = Math.round(width * (maxWidth / height));
                        height = maxWidth;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to create blob'));
                            return;
                        }

                        const optimizedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });

                        resolve(optimizedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};
