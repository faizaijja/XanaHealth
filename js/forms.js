
      let currentStep = 1;
      const totalSteps = 3;

      function updateStepProgress() {
        // Update step circles
        document.querySelectorAll(".step").forEach((step, index) => {
          const stepNumber = index + 1;
          step.classList.remove("active", "completed");

          if (stepNumber === currentStep) {
            step.classList.add("active");
          } else if (stepNumber < currentStep) {
            step.classList.add("completed");
          }
        });

        // Update progress line
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        document.getElementById("progressLineFill").style.width =
          progressPercentage + "%";

        // Show/hide form steps
        document.querySelectorAll(".form-step").forEach((step) => {
          step.classList.remove("active");
        });
        document
          .querySelector(`.form-step[data-step="${currentStep}"]`)
          .classList.add("active");

        // Update Previous button state
        const prevButtons = document.querySelectorAll(".btn-prev");
        prevButtons.forEach((btn) => {
          btn.disabled = currentStep === 1;
        });
      }

      function nextStep() {
        // Basic validation
        const currentStepElement = document.querySelector(
          `.form-step[data-step="${currentStep}"]`,
        );
        const requiredInputs =
          currentStepElement.querySelectorAll("[required]");
        let isValid = true;

        requiredInputs.forEach((input) => {
          if (!input.value.trim()) {
            isValid = false;
            input.style.backgroundColor = "#ffe6e6";
            setTimeout(() => {
              input.style.backgroundColor = "#f0f4f3";
            }, 2000);
          }
        });

        if (!isValid) {
          alert("Please fill in all required fields");
          return;
        }

        if (currentStep < totalSteps) {
          currentStep++;
          updateStepProgress();

          // Save data to localStorage
          saveFormData();
        }
      }

      function previousStep() {
        if (currentStep > 1) {
          currentStep--;
          updateStepProgress();
        }
      }

      function submitForm() {
        // Validate final step
        const currentStepElement = document.querySelector(
          `.form-step[data-step="${currentStep}"]`,
        );
        const requiredInputs =
          currentStepElement.querySelectorAll("[required]");
        let isValid = true;

        requiredInputs.forEach((input) => {
          if (!input.value.trim()) {
            isValid = false;
            input.style.backgroundColor = "#ffe6e6";
            setTimeout(() => {
              input.style.backgroundColor = "#f0f4f3";
            }, 2000);
          }
        });

        if (!isValid) {
          alert("Please fill in all required fields");
          return;
        }

        // Save all form data
        saveFormData();

        // Hide form steps and show success message
        document.querySelectorAll(".form-step").forEach((step) => {
          step.classList.remove("active");
        });
        document.querySelector(".step-progress").style.display = "none";
        document.getElementById("successMessage").classList.add("active");

        // Log the submitted data
        console.log("Form Data Submitted:", getFormData());
      }

      function saveFormData() {
        const formData = getFormData();
        localStorage.setItem("healthFacilityData", JSON.stringify(formData));
      }

      function getFormData() {
        return {
          facilityName: document.getElementById("facilityName").value,
          facilityType: document.getElementById("facilityType").value,
          facilityAddress: document.getElementById("facilityAddress").value,
          contactName: document.getElementById("contactName").value,
          contactEmail: document.getElementById("contactEmail").value,
          contactPhone: document.getElementById("contactPhone").value,
          bedCount: document.getElementById("bedCount").value,
          services: document.getElementById("services").value,
          operatingHours: document.getElementById("operatingHours").value,
          submittedAt: new Date().toISOString(),
        };
      }

      // Load saved data on page load (if any)
      window.addEventListener("DOMContentLoaded", () => {
        const savedData = localStorage.getItem("healthFacilityData");
        if (savedData) {
          const data = JSON.parse(savedData);
          document.getElementById("facilityName").value =
            data.facilityName || "";
          document.getElementById("facilityType").value =
            data.facilityType || "";
          document.getElementById("facilityAddress").value =
            data.facilityAddress || "";
          document.getElementById("contactName").value = data.contactName || "";
          document.getElementById("contactEmail").value =
            data.contactEmail || "";
          document.getElementById("contactPhone").value =
            data.contactPhone || "";
          document.getElementById("bedCount").value = data.bedCount || "";
          document.getElementById("services").value = data.services || "";
          document.getElementById("operatingHours").value =
            data.operatingHours || "";
        }
      });
    // Option 1: Fetch from a JSON file or API
fetch('https://restcountries.com/v3.1/all')
  .then(response => response.json())
  .then(data => {
    const countries = data
      .map(country => ({
        code: country.cca2,
        dialCode: country.idd.root + (country.idd.suffixes?.[0] || ''),
        name: country.name.common
      }))
      .filter(c => c.dialCode) // Remove countries without dial codes
      .sort((a, b) => a.name.localeCompare(b.name));
    
    populateCountryDropdown(countries);
  });

function populateCountryDropdown(countries) {
  const countryCodeSelect = document.getElementById('countryCode');
  
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country.dialCode;
    option.textContent = `${getFlag(country.code)} ${country.dialCode}`;
    countryCodeSelect.appendChild(option);
  });
  
  // Set Rwanda as default
  countryCodeSelect.value = '+250';
}

function getFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}