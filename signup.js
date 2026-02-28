import { supabase } from './subabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('form')

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault()

            // Correctly grab values from the DOM
            const firstName = document.getElementById('fname').value
            const lastName = document.getElementById('lname').value
            const emailValue = document.getElementById('email').value
            const passwordValue = document.getElementById('password').value

            // Get selected role from radio buttons
            const roleElement = document.querySelector('input[name="role"]:checked')
            const roleValue = roleElement ? roleElement.value : 'buyer'

            try {
                const { data, error } = await supabase.auth.signUp({
                    email: emailValue,
                    password: passwordValue,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            role: roleValue
                        }
                    }
                })

                if (error) throw error

                if (!data.user) {
                    throw new Error("User creation failed.")
                }

                // AFTER successful auth signup, we create the database record
                // We must do this BEFORE redirecting
                const { error: dbError } = await supabase
                    .from('profiles')
                    .upsert([{
                        id: data.user.id,
                        first_name: firstName,
                        last_name: lastName,
                        email: emailValue,
                        role: roleValue,
                    }])

                if (dbError) {
                    console.error('Database Error:', dbError.message)
                    throw new Error("Could not save profile information.")
                }

                // Now safe to redirect
                if (roleValue === 'agent') {
                    window.location.href = 'agent.html'
                } else {
                    window.location.href = 'index.html'
                }

            } catch (error) {
                console.error('Error during signup:', error.message)
                alert("Error: " + error.message)
            }


        })
    }
})