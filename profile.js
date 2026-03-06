import { supabase } from "./subabase.js";
import { initAuthUI } from "./auth.js";

document.addEventListener('DOMContentLoaded', async function () {
    // Initial UI Setup
    initAuthUI();

    const profileForm = document.getElementById('profile-form');
    const headerName = document.getElementById('header-name');
    const headerEmail = document.getElementById('header-email');
    const headerAvatar = document.getElementById('header-avatar');
    const logoutBtnSidebar = document.getElementById('logout-btn-sidebar');
    const avatar = document.getElementById('avatar-input');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // Mobile Menu Toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('opacity-0');
            mobileMenu.classList.toggle('translate-y-[-10px]');
            mobileMenu.classList.toggle('pointer-events-none');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.add('opacity-0');
                mobileMenu.classList.add('translate-y-[-10px]');
                mobileMenu.classList.add('pointer-events-none');
            }
        });
    }
    async function loadProfileData(user) {
        if (!user) {
            // Reset UI if no user
            if (headerName) headerName.textContent = 'Guest';
            if (headerEmail) headerEmail.textContent = 'Not logged in';
            return;
        }

        try {
            // Update basic info from user metadata first (fast)
            if (headerEmail) headerEmail.textContent = user.email;

            const metaFirstName = user.user_metadata?.first_name || '';
            const metaLastName = user.user_metadata?.last_name || '';
            if (headerName) headerName.textContent = `${metaFirstName} ${metaLastName}`.trim() || user.email.split('@')[0];

            // Fetch full profile from Supabase
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (profile) {
                // Update header with profile data
                const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                if (headerName) headerName.textContent = fullName || user.email.split('@')[0];
                if (headerEmail) headerEmail.textContent = profile.email || user.email;
                if (profile.profile_url && headerAvatar) headerAvatar.src = profile.profile_url;

                // Fill form fields
                if (profileForm) {
                    Object.keys(profile).forEach(key => {
                        const input = profileForm.querySelector(`[name="${key}"]`);
                        if (input) {
                            input.value = profile[key] || '';
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    // Handle Sidebar Logout
    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Error signing out:', error);
            window.location.href = 'index.html';
        });
    }

    //Update profile
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();


        const form = e.target;
        const formData = new FormData(form);
        const updates = Object.fromEntries(formData.entries());

        delete updates.email;

        try {
            const { data, error } = await supabase.from('profiles').update(
                updates
            ).eq('id', user.id);

            if (error) {
                console.error('Error updating profile:', error);
            } else {
                console.log('Profile updated successfully');
            }
        }
        catch (error) {
            console.error('Error updating profile:', error);
        }
    })


    // Listen for when a new file is selected
    avatar.addEventListener('change', async () => {

        // 1. Correct the length check to 'avatar.files.length'
        if (avatar.files && avatar.files.length > 0) {
            const file = avatar.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            try {

                const { error: uploadError } = await supabase.storage
                    .from('upload-image')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('upload-image')
                    .getPublicUrl(filePath);


                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ profile_url: publicUrl })
                    .eq('id', user.id);

                if (updateError) throw updateError;


                if (headerAvatar) headerAvatar.src = publicUrl;

                console.log('Profile photo updated successfully!');

            } catch (error) {
                console.error('Error uploading/updating profile photo:', error);
                alert('Failed to upload image. Check your storage policies.');
            }
        }
    });

    // Update profile logic consolidated into loadProfileData







    // Listen for Auth Changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
            loadProfileData(session?.user);
        } else if (event === 'SIGNED_OUT') {
            window.location.href = 'index.html';
        }
    });

    // Initial load
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        loadProfileData(user);
    } else {
        // If no user on profile page, redirect to login
        // window.location.href = 'login.html'; 
    }
});