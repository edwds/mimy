import React, { useState, useRef } from 'react';
import { optimizeImage } from '../utils/imageOptimizer';
import { X, Camera, Loader2 } from 'lucide-react';
import { UserProfile, RankingVisibility } from '../types';
import { ApiService } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

interface ProfileEditModalProps {
    user: UserProfile;
    onClose: () => void;
    onUpdate: (updatedUser: UserProfile) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, onClose, onUpdate }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [nickname, setNickname] = useState(user.nickname || '');
    const [bio, setBio] = useState(user.bio || '');
    const [previewImage, setPreviewImage] = useState(user.profileImage || user.photo);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [nicknameError, setNicknameError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateNickname = (name: string) => {
        const regex = /^[a-zA-Z0-9._-]+$/;
        if (name && !regex.test(name)) {
            setNicknameError(t('profileEdit.validation.invalid'));
            return false;
        }
        setNicknameError(null);
        return true;
    };

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNickname(value);
        validateNickname(value);
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const optimizedFile = await optimizeImage(file);
                setSelectedFile(optimizedFile);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result as string);
                };
                reader.readAsDataURL(optimizedFile);
            } catch (error) {
                console.error('Image optimization failed:', error);
                // Fallback to original file
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSave = async () => {
        if (!user.id) return;
        if (!validateNickname(nickname)) return;

        setIsSaving(true);
        try {
            let profileImageUrl = user.profileImage;

            if (selectedFile) {
                const uploadedUrl = await ApiService.uploadImage(selectedFile);
                profileImageUrl = uploadedUrl;
            }

            const updatedUser = await ApiService.updateUser(user.id, {
                nickname,
                bio,
                profileImage: profileImageUrl
            });

            onUpdate(updatedUser);
            showToast(t('profileEdit.success'));
            onClose();
        } catch (error) {
            console.error('Failed to update profile:', error);
            showToast(t('profileEdit.failure'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-black">{t('profileEdit.title')}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Image Upload Area */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img
                                src={previewImage}
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg transition-transform group-hover:scale-105"
                                alt="Preview"
                            />
                            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm font-bold text-primary hover:underline"
                        >
                            {t('profileEdit.changePhoto')}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <Input
                                label={t('profileEdit.nickname')}
                                value={nickname}
                                onChange={handleNicknameChange}
                                placeholder={t('profileEdit.nicknamePlaceholder')}
                                className={nicknameError ? 'border-red-500' : ''}
                            />
                            {nicknameError && (
                                <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {nicknameError}
                                </p>
                            )}
                        </div>
                        <TextArea
                            label={t('profileEdit.bio')}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder={t('profileEdit.bioPlaceholder')}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
                        {t('profileEdit.cancel')}
                    </Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t('profileEdit.saving')}</span>
                            </div>
                        ) : t('profileEdit.save')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
