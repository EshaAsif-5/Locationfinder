

    let initialUserAge = null;
    let allCountriesData = [];

    const myModal = document.getElementById("myModal");
    const modalMessage = document.getElementById("modalMessage");
    const modalButtons = document.getElementById("modalButtons");
    const closeButtonInfoModal = document.querySelector(".info-modal-close");

    const ageInputModal = document.getElementById("ageInputModal");
    const ageInputModalMessage = document.getElementById("ageInputModalMessage");
    const ageInputField = document.getElementById("ageInputField");
    const submitAgeButton = document.getElementById("submitAgeButton");

    const welcomeLocationSpan = document.getElementById("welcomeLocation");

    function showModal(message, buttons = []) {
      modalMessage.textContent = message;
      modalButtons.innerHTML = '';
      if (buttons.length > 0) {
        buttons.forEach(btn => {
          const buttonElement = document.createElement('button');
          buttonElement.textContent = btn.text;
          buttonElement.onclick = () => {
            hideModal();
            if (btn.action) {
              btn.action();
            }
          };
          modalButtons.appendChild(buttonElement);
        });
      }
      myModal.style.display = "flex";
    }

    function hideModal() {
      myModal.style.display = "none";
    }

    closeButtonInfoModal.onclick = hideModal;

    window.onclick = function(event) {
      if (event.target == myModal) {
        hideModal();
      }
    }

    function toggleTheme() {
      document.body.classList.toggle("dark-mode");
    }

    const IPINFO_API_TOKEN = '5263d01b4bc02a';
    const locationDisplay = document.getElementById("location-display");
    let detectedCountryName = "";
    let detectedCountryCode = "";

    const dobInput = document.getElementById("dob");
    const ageInfoDiv = document.getElementById("ageInfo");
    const initialAgeDisplay = document.getElementById("initialAgeDisplay");

    dobInput.addEventListener("change", () => {
      const dob = new Date(dobInput.value);
      const today = new Date();

      if (isNaN(dob.getTime())) {
        ageInfoDiv.textContent = "Please select a valid date.";
        return;
      }

      let years = today.getFullYear() - dob.getFullYear();
      let months = today.getMonth() - dob.getMonth();
      let days = today.getDate() - dob.getDate();

      if (days < 0) {
        months--;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      const calculatedAge = years;

      if (initialUserAge !== null && parseInt(initialUserAge) !== calculatedAge) {
        showModal("Age doesn't match the age you entered initially. You cannot proceed.", [
          { text: "OK", action: () => {
            dobInput.value = "";
            ageInfoDiv.innerHTML = "";
          }}
        ]);
      } else if (initialUserAge !== null) {
        ageInfoDiv.innerHTML = `Your calculated age is <strong>${years} years</strong>, ${months} months, and ${days} days.`;
      }
    });

    const input = document.getElementById("countrySearch");
    const dropdown = document.getElementById("dropdown");
    const infoBox = document.getElementById("countryInfo");
    const flag = document.getElementById("flag");
    const nameEl = document.getElementById("name");
    const capital = document.getElementById("capital");
    const population = document.getElementById("population");

    fetch("https://restcountries.com/v3.1/all?fields=name,capital,population,flags,cca2")
      .then(res => res.json())
      .then(data => {
        allCountriesData = data.map(c => ({
          name: c.name.common,
          capital: c.capital ? c.capital[0] : "N/A",
          population: c.population.toLocaleString(),
          flag: c.flags?.png || "",
          code: c.cca2
        })).sort((a, b) => a.name.localeCompare(b.name));

        fetch(`https://ipinfo.io/json?token=${IPINFO_API_TOKEN}`)
            .then(res => res.json())
            .then(ipData => {
                const { ip, country, city, region, country_name } = ipData;
                
                detectedCountryName = country_name || country;
                detectedCountryCode = country;

                locationDisplay.textContent = `IP: ${ip}, Location: ${city}, ${region}, ${detectedCountryName}`;
                welcomeLocationSpan.textContent = detectedCountryName;

                localStorage.setItem("userIP", ip);
                localStorage.setItem("userCountry", detectedCountryName);

                const detectedCountryMatch = allCountriesData.find(c =>
                    c.code.toLowerCase() === detectedCountryCode.toLowerCase() ||
                    c.name.toLowerCase() === detectedCountryName.toLowerCase()
                );

                if (detectedCountryMatch) {
                    selectCountry(detectedCountryMatch, true);
                }
            })
            .catch(() => {
                locationDisplay.textContent = "Could not detect location.";
                welcomeLocationSpan.textContent = "your location";
            });
      });

    input.addEventListener("input", () => {
      const query = input.value.toLowerCase();
      dropdown.innerHTML = "";
      if (!query) {
        dropdown.style.display = "none";
        return;
      }

      const matches = allCountriesData.filter(c => c.name.toLowerCase().includes(query));

      if (matches.length > 0) {
        dropdown.style.display = "block";
        matches.slice(0, 20).forEach(country => {
          const div = document.createElement("div");
          div.textContent = country.name;
          div.addEventListener("click", () => selectCountry(country));
          dropdown.appendChild(div);
        });
      } else {
        dropdown.style.display = "none";
      }
    });

    function selectCountry(country, isAutoSelected = false) {
      input.value = country.name;
      dropdown.style.display = "none";

      flag.src = country.flag;
      nameEl.textContent = country.name;
      capital.textContent = country.capital;
      population.textContent = country.population;
      infoBox.style.display = "block";

      localStorage.setItem("selectedCountry", country.name);

      if (!isAutoSelected && detectedCountryCode && country.code) {
        if (detectedCountryCode.toLowerCase() !== country.code.toLowerCase()) {
            showModal(`You selected ${country.name}, but your detected country is ${detectedCountryName}.`);
        }
      } else if (!isAutoSelected && detectedCountryName && detectedCountryName.toLowerCase() !== country.name.toLowerCase()) {
         showModal(`You selected ${country.name}, but your detected country is ${detectedCountryName}.`);
      }
    }

    function resetAll() {
      localStorage.clear();
      location.reload();
    }

    function showAgeInputModal(message = "Please enter your age:") {
        ageInputModalMessage.textContent = message;
        ageInputField.value = '';
        ageInputModal.style.display = "flex";
        ageInputField.focus();
    }

    function hideAgeInputModal() {
        ageInputModal.style.display = "none";
    }

    submitAgeButton.addEventListener("click", () => {
        const ageInput = ageInputField.value;
        if (ageInput.trim() === "") {
            showAgeInputModal("Age is required to proceed. Please enter your age:");
            return;
        }

        const age = parseInt(ageInput);
        if (isNaN(age) || age <= 0) {
            showAgeInputModal("Please enter a valid positive number for your age.");
            return;
        }

        if (age < 18) {
            hideAgeInputModal();
            showModal("Access denied. You must be 18 or older to use this application.", [
                { text: "Go to Google", action: () => { window.location.href = "https://www.google.com"; }}
            ]);
            return;
        } else {
            initialUserAge = age;
            localStorage.setItem("userAgePrompt", age);
            initialAgeDisplay.textContent = `Age entered initially: ${initialUserAge}`;
            hideAgeInputModal();
        }
    });

    window.addEventListener("load", () => {
      const storedAge = localStorage.getItem("userAgePrompt");
      if (storedAge) {
        initialUserAge = parseInt(storedAge);
        initialAgeDisplay.textContent = `Age entered initially: ${initialUserAge}`;
      } else {
        showAgeInputModal();
      }
    });
