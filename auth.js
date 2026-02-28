import { supabase } from './subabase.js';

/**
 * Shared function to initialize Navbar and Profile UI.
 * This handles Sign In/Sign Out toggling, initials, and the detailed profile dropdown.
 */
export async function initAuthUI() {
    const profileBtn = document.getElementById('profile');
    const profileContent = document.getElementById('profile-content');
    const profileInfo = document.getElementById('profile-info');
    const loginBtn = document.getElementById('login');
    const signupBtn = document.getElementById('signup');

    if (!profileBtn || !profileContent || !profileInfo) {
        console.warn('Navbar profile elements missing. Ensure #profile, #profile-content, and #profile-info exist.');
    }

    // Update UI based on user state
    async function updateNavbarUI(user) {
        // ALWAYS show profile button, but hide old standalone login/signup buttons
        if (profileBtn) profileBtn.classList.remove('hidden');
        if (loginBtn) loginBtn.classList.add('hidden');
        if (signupBtn) signupBtn.classList.add('hidden');

        if (user) {
            // --- SIGNED IN STATE ---

            // 1. Set Avatar/Initials
            const metaFirstName = user.user_metadata?.first_name || '';
            const metaLastName = user.user_metadata?.last_name || '';
            const initials = (metaFirstName[0] || user.email[0] || 'U').toUpperCase() + (metaLastName[0] || '').toUpperCase();

            if (profileContent) {
                if (user.user_metadata?.avatar_url) {
                    profileContent.innerHTML = `<img src="${user.user_metadata.avatar_url}" class="w-full h-full object-cover">`;
                } else {
                    profileContent.innerHTML = `<span class="text-sm font-bold uppercase">${initials}</span>`;
                }
            }

            // 2. Fetch and Populate Dropdown
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileInfo) {
                    const displayFirstName = profile?.first_name || metaFirstName || 'User';
                    const displayLastName = profile?.last_name || metaLastName || '';
                    const displayEmail = profile?.email || user.email;
                    const displayRole = profile?.role || user.user_metadata?.role || 'Guest';

                    profileInfo.innerHTML = `
                        <div class="space-y-4">
                            <div class="border-b border-gray-100 pb-3">
                                <p class="font-bold text-gray-900">${displayFirstName} ${displayLastName}</p>
                                <p class="text-xs text-gray-500 truncate">${displayEmail}</p>
                                <p class="inline-block px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-bold rounded-md uppercase tracking-wider mt-1">${displayRole}</p>
                            </div>
                            <div class="space-y-1">
                                <a href="agent.html" class="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 transition-colors p-2 rounded-lg hover:bg-gray-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    My profile
                                </a>
                                <button id="logout-btn-global" class="w-full text-left flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    `;

                    const logoutBtn = document.getElementById('logout-btn-global');
                    if (logoutBtn) {
                        logoutBtn.onclick = async (e) => {
                            e.preventDefault();
                            await supabase.auth.signOut();
                            window.location.href = 'index.html';
                        };
                    }
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            }
        } else {
            // --- GUEST STATE ---
            if (profileContent) {
                profileContent.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                `;
            }

            if (profileInfo) {
                profileInfo.innerHTML = `
                    <div class="space-y-4">
                        <div class="border-b border-gray-100 pb-3">
                            <p class="font-bold text-gray-900">Welcome to LUXE</p>
                            <p class="text-xs text-gray-500">Sign in to manage your properties</p>
                        </div>
                        <div class="flex flex-col gap-2">
                            <a href="login.html" class="w-full bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold text-center hover:bg-brand-700 transition-all text-sm shadow-md shadow-brand-100">
                                Sign In
                            </a>
                            <a href="signup.html" class="w-full bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold text-center hover:bg-gray-800 transition-all text-sm shadow-md shadow-gray-200">
                                Create Account
                            </a>
                        </div>
                    </div>
                `;
            }
        }

        // Re-initialize Lucide icons
        if (window.lucide) window.lucide.createIcons();
    }

    // Profile Dropdown Toggle
    if (profileBtn) {
        // Remove old listeners to avoid duplicates
        const newProfileBtn = profileBtn.cloneNode(true);
        profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);

        newProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profileInfo) {
                profileInfo.classList.toggle('hidden');
            }
        });
    }

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (profileInfo && !profileInfo.contains(e.target)) {
            profileInfo.classList.add('hidden');
        }
    });

    // Listen for Auth Changes
    supabase.auth.onAuthStateChange((event, session) => {
        updateNavbarUI(session?.user);
    });

    // Initial load check
    const { data: { user } } = await supabase.auth.getUser();
    updateNavbarUI(user);
}
