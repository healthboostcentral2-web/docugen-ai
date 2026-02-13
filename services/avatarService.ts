import { Avatar } from "../types";

const SYSTEM_AVATARS: Avatar[] = [
    {
        id: 'anna',
        name: 'Anna',
        imageUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600',
        gender: 'Female',
        style: 'realistic',
        previewVideoUrl: 'https://cdn.coverr.co/videos/coverr-woman-talking-to-camera-5496/1080p.mp4'
    },
    {
        id: 'david',
        name: 'David',
        imageUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600',
        gender: 'Male',
        style: 'realistic',
        previewVideoUrl: 'https://cdn.coverr.co/videos/coverr-man-talking-on-phone-5506/1080p.mp4'
    },
    {
        id: 'sarah',
        name: 'Sarah',
        imageUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
        gender: 'Female',
        style: 'realistic',
        previewVideoUrl: 'https://cdn.coverr.co/videos/coverr-woman-working-at-home-4752/1080p.mp4'
    },
    {
        id: 'james',
        name: 'James',
        imageUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
        gender: 'Male',
        style: 'realistic',
        previewVideoUrl: 'https://cdn.coverr.co/videos/coverr-man-working-in-office-5234/1080p.mp4'
    },
    {
        id: 'anime_girl',
        name: 'Yuki',
        imageUrl: 'https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=600', // Placeholder
        gender: 'Female',
        style: 'anime',
    }
];

export const avatarService = {
    /**
     * Get list of available system avatars
     */
    getAvatars: async (): Promise<Avatar[]> => {
        // Simulate API call
        return new Promise(resolve => setTimeout(() => resolve(SYSTEM_AVATARS), 300));
    },

    /**
     * Create a new avatar from user file or capture
     */
    createUserAvatar: async (fileOrBlob: File | Blob): Promise<Avatar> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const newAvatar: Avatar = {
                    id: `user-avatar-${Date.now()}`,
                    name: 'Custom Avatar',
                    imageUrl: base64data,
                    gender: 'Female', // Default, user could change in a real app
                    style: 'realistic',
                };
                setTimeout(() => resolve(newAvatar), 1000); // Simulate processing
            };
            reader.readAsDataURL(fileOrBlob);
        });
    },

    /**
     * Simulates the Wav2Lip / SadTalker generation process
     * Returns a video URL (mocked)
     */
    generateTalkingAvatar: async (avatarId: string, text: string, voiceId: string): Promise<string> => {
        console.log(`Generating avatar video for ${avatarId} with voice ${voiceId}: "${text}"`);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Return a mock result video
                // In production, this would return the URL from the Wav2Lip backend
                const avatar = SYSTEM_AVATARS.find(a => a.id === avatarId);
                // If it's a user avatar (not in system list), use a generic fallback or the first system one for demo
                const mockUrl = avatar?.previewVideoUrl || 'https://cdn.coverr.co/videos/coverr-woman-talking-to-camera-5496/1080p.mp4';
                resolve(mockUrl);
            }, 4000); // Simulate 4s processing time
        });
    }
};