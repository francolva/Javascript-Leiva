/** 
Fetch localStorage from local .json data asynchronously.
*/
const getLocalStorage = async () => {
    try {
        const fetchResponse = await fetch('assets/products.json');
        const products = await fetchResponse.json();
        let productIndex = 1;
        products.forEach((product) => {
            localStorage.setItem(productIndex.toString(), JSON.stringify(product));
            productIndex++;
        })
    } catch(error) {
        console.error(error)
    }
}


/**
 * Toastify notifications alerting the user of the invalid input.
 */
const wrongQuantityAlert = {
    text: "Por favor, ingrese un número válido",
    duration: 3000,
    gravity: "bottom",
    position: "right",
    ariaLive: "assertive",
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
}


const wrongInstallmentsAlert = {
    text: "Por favor, ingrese un valor entre 1, 3 o 6",
    duration: 3000,
    gravity: "bottom",
    position: "right",
    ariaLive: "assertive",
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
}


/**
 * Constructor class of the button objects.
 * @param {String} buttonId         Buttons ID in the HTML
 * @param {Function} buttonFunction Function of the button action when clicked
 */
class Button {
    constructor(buttonId, buttonFunction) {
        this.documentButton = document.getElementById(buttonId);
        this.clickButton    = function() {
            this.documentButton.addEventListener('click', buttonFunction)
        };
        this.remove         = function() {this.documentButton.remove()}
    }
}


/**
General function to create HTML elements for user input response.
*/
function createUserResponse(parentId, elementTag, elementClass, elementContent, elementId) {
    let parentTag = document.getElementById(parentId);
    let responseTag = document.createElement(elementTag);
    responseTag.classList.add(elementClass);
    try {
        responseTag.id = elementId;
    } catch (error) {
        responseTag.removeAttribute('id');
    }
    responseTag.innerHTML = elementContent;
    parentTag.appendChild(responseTag);
}


/**
 * "See more" button definition.
 */
const buttonSeeMore = new Button("seeMore", clickSeeMoreButton);
buttonSeeMore.clickButton();


/**
 * Click action for "see more" button.
 */
function clickSeeMoreButton() {
    getLocalStorage()
        .then(() => {
            buttonSeeMore.remove(); 
            for (key = 1; key < localStorage.length; key++) {
                if (localStorage.getItem(key) === null) {
                    break
                }
            
                const name = JSON.parse(localStorage.getItem(key)).nombre;
                const photoQuantity = JSON.parse(localStorage.getItem(key)).cantidadFotos;
                const partialPrice = JSON.parse(localStorage.getItem(key)).precioParcial;
                const seeMoreContent = `Pack ${name}: ${photoQuantity} fotos a ${partialPrice} ARS`;
                createUserResponse("seeMoreButton__container", "li", "main__li", seeMoreContent);
            }
        }
    )       
}


/**
 * "Simulate" button definition.
 */
const buttonSimulatePrice = new Button("simulate", clickSimulatePrice);
buttonSimulatePrice.clickButton();


/**
 * Click action for "simulate" button.
 */
function clickSimulatePrice() {
    let simulatedPriceValue     = priceSimulator();
    let simulatedPriceDisplay   = document.getElementById("simulatedPrice");

    /* If the input changes, this refreshes the result displayed */
    if (simulatedPriceDisplay && typeof simulatedPriceValue === "string") {
        simulatedPriceDisplay.remove();
        simulatedPriceDisplay.innerHTML = simulatedPriceValue;
    }
    
    /* And this catches the undefined value if the button is pressed
    with any empty input */
    else if (typeof simulatedPriceValue != "string") {
        try {
            simulatedPriceDisplay.remove();
        } catch (error) {
            console.warn(error)
        }
    }
    else {
        createUserResponse("simulateButton__container", "span", "main__span", simulatedPriceValue, "simulatedPrice");
    }
}


/**
* Main operations over prices definition (discounts and taxes).
*/
function calculatePrice(priceModifier) {
    switch (priceModifier) {
        case "IVA":
            return (baseValue) => baseValue*1.21;
        case "RECHARGE":
            return (baseValue, recharge) => baseValue+recharge*baseValue;
        case "DISCOUNT":
            return (baseValue, discount) => baseValue-discount*baseValue;
    }
}


/**
 * Specialized callbacks functions for each operation.
 */
const calcIVA = calculatePrice("IVA");
const calcInstallments = calculatePrice("RECHARGE");
const calcDiscounts = calculatePrice("DISCOUNT");


/**
 * Calculates the estimated price after the recharge has been aplied.
 * @param {Number} price Base price passed onto the function
 * @returns {Number}     Calculated price after installments recharge
 */
function installmentsSimulator(price) {
    const recharge3 = 0.15
    const recharge6 = 0.30

    let installmentsQntty = parseInt(document.getElementById("installments").value);
    switch (installmentsQntty) {
        case 1:
            return parseInt(price);
        case 3:
            return parseInt(calcInstallments(price, recharge3));
        case 6:
            return parseInt(calcInstallments(price, recharge6));
        default:
            Toastify(wrongInstallmentsAlert).showToast();
    }
}


/**
 * Calculates the current local timestamp using Luxon library.
 * @returns {String} Current formatted short with seconds datetime.
 */
function getLocalDateTime() {
    try {
        let DateTime = luxon.DateTime;
        let dt = DateTime.now();
        let localDateTimeNow = dt.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
        return localDateTimeNow;
    } catch(error) {
        console.error(error)
    }
}


/**
 * Calculates the estimated price after discount and tax. Not the final estimation.
 * @returns {String} Estimated price number before final tax application.
 */
function priceSimulator() {
    const unitBasePrice = 100;
    const minorDiscount = 0.85;
    const majorDiscount = 0.75;
    let finalPrice = null;

    let inputNumber = parseInt(document.getElementById("quantity").value);
    if (inputNumber >= 0 && inputNumber <= 100) {
        let basePrice = unitBasePrice*calcIVA(inputNumber);
        finalPrice = installmentsSimulator(basePrice);
        if (!finalPrice) {
            return
        }
    }
    else if (inputNumber > 100 && inputNumber <= 500) {
        let basePrice = unitBasePrice*calcDiscounts(calcIVA(inputNumber), minorDiscount);
        finalPrice = installmentsSimulator(basePrice);
        if (!finalPrice) {
            return
        }
    }
    else if (inputNumber > 500 && inputNumber <=10000) {
        let basePrice = unitBasePrice*calcDiscounts(calcIVA(inputNumber), majorDiscount);
        finalPrice = installmentsSimulator(basePrice);
        if (!finalPrice) {
            return
        }
    }
    else {
        Toastify(wrongQuantityAlert).showToast();
    }
    try {
        let inputSummary = `Qtty: ${inputNumber.toString()} ; Price: ${finalPrice.toString()}`;
        localStorage.setItem(getLocalDateTime(), inputSummary);
        return ("$" + finalPrice.toString());
    } catch(error) {
        console.error(error)
    }
}