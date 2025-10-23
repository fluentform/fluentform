/**
 * Password Field Enhancement Module for Fluent Forms
 *
 */

(function ($) {
    "use strict";

    const PasswordFieldEnhancer = {
        /**
         * Initialize password fields
         */
        init: function () {
            this.initPasswordFields();
        },

        /**
         * Initialize all password fields on the page
         */
        initPasswordFields: function () {
            const $passwordFields = $('input[data-password-field="true"]');

            $passwordFields.each((index, field) => {
                this.initSinglePasswordField($(field));
            });
        },

        /**
         * Initialize a single password field
         */
        initSinglePasswordField: function ($field) {
            const $wrapper = $field.closest(".ff-password-wrapper");
            const features = JSON.parse(
                $field.attr("data-password-features") || "{}"
            );
            const requirements = JSON.parse(
                $field.attr("data-password-requirements") || "{}"
            );

            const minLength = parseInt($field.attr("minlength")) || 0;
            if (minLength > 0) requirements.min_length = minLength;

            // Initialize password strength indicator
            if (
                features.show_strength_indicator &&
                $wrapper.find(".ff-password-strength-indicator").length > 0
            ) {
                const that = this;
                $field.on("input", function () {
                    that.updatePasswordStrength($field, requirements);
                });
            }

            // Initialize toggle button
            if (
                features.show_toggle_button &&
                $wrapper.find(".ff-password-toggle-btn").length > 0
            ) {
                const that = this;
                const $toggleBtn = $wrapper.find(".ff-password-toggle-btn");
                const $icon = $toggleBtn.find(".ff-password-toggle-icon");

                // Set initial icon class
                $icon.addClass("ff-eye-icon");

                // Simple click toggle for all browsers
                $toggleBtn.on("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that.togglePasswordVisibility($field);
                });
            }

            // Initialize generate button
            if (
                features.show_generate_button &&
                $wrapper.find(".ff-password-generate-btn").length > 0
            ) {
                const that = this;
                $wrapper
                    .find(".ff-password-generate-btn")
                    .on("click", function () {
                        that.generatePassword($field, requirements);
                    });
            }

            // Initialize requirements validation
            if (
                features.show_requirements_list &&
                $wrapper.find(".ff-password-requirements").length > 0
            ) {
                const that = this;
                $field.on("input", function () {
                    that.validatePasswordRequirements($field, requirements);
                });
            }
        },

        /**
         * Update password strength indicator
         */
        updatePasswordStrength: function ($field, requirements) {
            const password = $field.val();
            const strength = this.calculatePasswordStrength(
                password,
                requirements
            );
            const $wrapper = $field.closest(".ff-password-wrapper");
            const $strengthFill = $wrapper.find(".ff-password-strength-fill");
            const $strengthText = $wrapper.find(".ff-password-strength-text");

            // Only update if strength indicator exists
            if ($strengthFill.length > 0 && $strengthText.length > 0) {
                $strengthFill.css("width", strength.percentage + "%");
                $strengthFill.removeClass("very-weak weak fair good strong");
                $strengthFill.addClass(strength.level);

                $strengthText.text(strength.text);
                $strengthText.removeClass("very-weak weak fair good strong");
                $strengthText.addClass(strength.level);
            }
        },

        /**
         * Calculate password strength
         */
        calculatePasswordStrength: function (password, requirements) {
            if (!password) {
                return { percentage: 0, level: "very-weak", text: "Very Weak" };
            }

            let score = 0;
            let maxScore = 0;

            const minLength = requirements.min_length || 8;
            maxScore += 30;

            if (password.length >= minLength) {
                score += 30;
            } else if (password.length >= minLength * 0.75) {
                score += 20;
            } else if (password.length >= minLength * 0.5) {
                score += 10;
            }

            // Strong password check (uppercase, lowercase, numbers, special characters)
            if (requirements.require_strong_password) {
                maxScore += 70;
                const hasUppercase = /[A-Z]/.test(password);
                const hasLowercase = /[a-z]/.test(password);
                const hasNumbers = /[0-9]/.test(password);
                const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

                if (
                    hasUppercase &&
                    hasLowercase &&
                    hasNumbers &&
                    hasSpecialChars
                ) {
                    score += 70;
                } else {
                    // Partial scoring for incomplete requirements
                    if (hasUppercase) score += 15;
                    if (hasLowercase) score += 15;
                    if (hasNumbers) score += 20;
                    if (hasSpecialChars) score += 20;
                }
            } else {
                // Default scoring when strong password is not required
                maxScore += 70;
                if (/[A-Z]/.test(password)) score += 15;
                if (/[a-z]/.test(password)) score += 15;
                if (/[0-9]/.test(password)) score += 20;
                if (/[^A-Za-z0-9]/.test(password)) score += 20;
            }

            const percentage = Math.round((score / maxScore) * 100);
            let level, text;

            if (percentage >= 80) {
                level = "strong";
                text = "Strong";
            } else if (percentage >= 60) {
                level = "good";
                text = "Good";
            } else if (percentage >= 40) {
                level = "fair";
                text = "Fair";
            } else if (percentage >= 20) {
                level = "weak";
                text = "Weak";
            } else {
                level = "very-weak";
                text = "Very Weak";
            }

            return { percentage: percentage, level: level, text: text };
        },

        /**
         * Toggle password visibility
         */
        togglePasswordVisibility: function ($field) {
            const $wrapper = $field.closest(".ff-password-wrapper");
            const $toggleBtn = $wrapper.find(".ff-password-toggle-btn");
            const $icon = $toggleBtn.find(".ff-password-toggle-icon");

            if ($field.attr("type") === "password") {
                $field.attr("type", "text");
                $icon.removeClass("ff-eye-icon").addClass("ff-eye-slash-icon");
                $toggleBtn.attr("aria-label", "Hide password");
            } else {
                $field.attr("type", "password");
                $icon.removeClass("ff-eye-slash-icon").addClass("ff-eye-icon");
                $toggleBtn.attr("aria-label", "Show password");
            }
        },

        /**
         * Generate a strong password
         */
        generatePassword: function ($field, requirements) {
            const password = this.createStrongPassword(requirements);
            $field.val(password).trigger("input");
        },

        /**
         * Create a strong password
         */
        createStrongPassword: function (requirements) {
            const minLength = requirements.min_length || 8;
            const length = Math.max(12, minLength);

            let charset = "";
            let requiredChars = "";

            // Always include basic character sets
            charset += "abcdefghijklmnopqrstuvwxyz";
            charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            charset += "0123456789";

            // If strong password is required, ensure we have all character types
            if (requirements.require_strong_password) {
                charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";
                requiredChars += "abcdefghijklmnopqrstuvwxyz".charAt(
                    Math.floor(Math.random() * 26)
                );
                requiredChars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(
                    Math.floor(Math.random() * 26)
                );
                requiredChars += "0123456789".charAt(
                    Math.floor(Math.random() * 10)
                );
                requiredChars += "!@#$%^&*()_+-=[]{}|;:,.<>?".charAt(
                    Math.floor(Math.random() * 25)
                );
            } else {
                // Add special characters to charset even if not required for variety
                charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";
            }

            // Fill the rest with the password
            let password = requiredChars;
            for (var i = requiredChars.length; i < length; i++) {
                password += charset.charAt(
                    Math.floor(Math.random() * charset.length)
                );
            }

            // Shuffle the password
            return password
                .split("")
                .sort(function () {
                    return 0.5 - Math.random();
                })
                .join("");
        },

        /**
         * Validate password requirements
         */
        validatePasswordRequirements: function ($field, requirements) {
            const password = $field.val();
            const $wrapper = $field.closest(".ff-password-wrapper");
            const $requirements = $wrapper.find(".ff-password-requirement");
            let allValid = true;
            let hasRequirements = false;

            // Only proceed if requirements list exists
            if ($requirements.length === 0) {
                return;
            }

            $requirements.each(function () {
                const $req = $(this);
                const requirement = $req.data("requirement");
                let isValid = false;
                hasRequirements = true;

                switch (requirement) {
                    case "min_length":
                        const minLength = requirements.min_length || 8;
                        isValid = password.length >= minLength;
                        break;
                    case "strong_password":
                        const hasUppercase = /[A-Z]/.test(password);
                        const hasLowercase = /[a-z]/.test(password);
                        const hasNumbers = /[0-9]/.test(password);
                        const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
                        isValid =
                            hasUppercase &&
                            hasLowercase &&
                            hasNumbers &&
                            hasSpecialChars;
                        break;
                }

                if (!isValid) allValid = false;

                $req.toggleClass("ff-requirement-valid", isValid);
                $req.toggleClass(
                    "ff-requirement-invalid",
                    !isValid && password.length > 0
                );
            });

            // Add visual feedback to input field
            if (password.length > 0 && hasRequirements) {
                $field.toggleClass("ff-password-valid", allValid);
                $field.toggleClass("ff-password-invalid", !allValid);
            } else {
                $field.removeClass("ff-password-valid ff-password-invalid");
            }
        },
    };

    // Auto-initialize when DOM is ready with Firefox compatibility
    $(document).ready(function () {
        setTimeout(function () {
            PasswordFieldEnhancer.init();
        }, 100);
    });

    // Also initialize on window load for Firefox
    $(window).on("load", function () {
        setTimeout(function () {
            PasswordFieldEnhancer.init();
        }, 50);
    });

    // Make it globally available
    window.FluentFormPasswordField = PasswordFieldEnhancer;
})(jQuery);
