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

            // Load Favorites Data
            const favorites = await getSavedFavorites(user.id);
            if (favorites) {
                displaySavedFavorites(favorites);
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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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
                alert('Error updating profile');
            } else {
                alert('Profile updated successfully!');
                loadProfileData(user); // Refresh UI
            }
        }
        catch (error) {
            console.error('Error updating profile:', error);
        }
    })


    // Listen for when a new file is selected
    avatar.addEventListener('change', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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

    // saved favorites functions
    async function getSavedFavorites(userId) {
        const { data, error } = await supabase
            .from('favorites')
            .select('property_id, properties(*)')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching favorites:', error);
            return [];
        }
        return data.map(item => item.properties);
    }

    function displaySavedFavorites(properties) {
        const container = document.getElementById('saved-properties-container');
        const badge = document.getElementById('favorites-count-badge');

        if (!container) return;

        if (badge) badge.textContent = properties.length;
        container.innerHTML = '';

        if (properties.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p class="text-gray-400 font-medium">No saved properties yet.</p>
                    <a href="index.html#featured" class="text-brand-600 font-bold hover:underline mt-2 inline-block">Explore Listings</a>
                </div>`;
            return;
        }

        properties.forEach(property => {
            const price = property.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(property.price) : 'Price on Request';
            const status = property.offer_type === 'sale' ? 'For Sale' : 'For Rent';

            const card = document.createElement('div');
            card.className = "group bg-gray-50 rounded-3xl p-3 shadow-none hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden relative";
            card.innerHTML = `
                <div class="relative h-48 rounded-[1.5rem] overflow-hidden mb-4 bg-gray-100">
                    <img src="${property.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop'}" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute top-3 left-3 flex gap-2">
                        <span class="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-full shadow-lg z-10">${status}</span>
                    </div>
                    <button onclick="unfavorite('${property.id}')" 
                            class="absolute top-3 right-3 w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
                <div class="px-3 pb-2">
                    <h4 class="text-lg font-bold text-gray-900 mb-1 group-hover:text-brand-600 transition-colors truncate">
                        ${property.city}, ${property.state}
                    </h4>
                    <p class="text-xs text-gray-500 mb-3 truncate">${property.street || 'Location pending'}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xl font-bold text-gray-900">${price}</span>
                        <a href="details.html?id=${property.id}" class="text-brand-600 hover:text-brand-700 font-bold text-sm">Details</a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async function unfavorite(propertyId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (confirm('Remove this property from your favorites?')) {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('property_id', propertyId);

            if (error) {
                console.error('Error removing favorite:', error);
                alert('Failed to remove from favorites');
            } else {
                // Refresh list
                const favorites = await getSavedFavorites(user.id);
                displaySavedFavorites(favorites);
            }
        }
    }

    // Expose unfavorite to global scope for onclick
    window.unfavorite = unfavorite;

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