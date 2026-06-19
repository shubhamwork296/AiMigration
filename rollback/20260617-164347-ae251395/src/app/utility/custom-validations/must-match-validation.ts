import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

//custom validator to check that two fields match
export function MustMatch(controlName: string, matchingControlName: string, isEmailField: boolean) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        const matchingControl = formGroup.controls[matchingControlName];

        if (matchingControl.errors && !matchingControl.errors.mustMatch) {
            // return if another validator has already found an error on the matchingControl
            return;
        }

        // set error on matchingControl if validation fails
        if (isEmailField) {
            if (control.value.toLowerCase() !== matchingControl.value.toLowerCase()) {
                matchingControl.setErrors({ mustMatch: true });
            } else {
                matchingControl.setErrors(null);
            }
        }
        else {
            if (control.value !== matchingControl.value) {
                matchingControl.setErrors({ mustMatch: true });
            } else {
                matchingControl.setErrors(null);
            }
        }
    }
}

export function checkMobileValidation(mobileNumber: string) {
    return (formGroup: FormGroup) => {
        const mobileNumberControl = formGroup.controls[mobileNumber];
        if (mobileNumberControl.value) {

            let mobileWithoutFirstChar = mobileNumberControl.value.substring(1);

            const isNumOnly = /^\d+$/.test(mobileWithoutFirstChar);



            let plusCount = 0;
            let plusSign = "+";
            for (let i = 0; i < mobileNumberControl.value.length; i++) {
                if (plusSign.indexOf(mobileNumberControl.value.charAt(i)) != -1) {
                    plusCount++;
                }
            }
            let regex = /[A-Za-z]+/g;
            if (regex.test(mobileNumberControl.value)) {
                let newval = mobileNumberControl.value.replace(/[^0-9\+]+/, "");
                mobileNumberControl.setValue(newval);
                mobileNumberControl.setErrors({ letterError: true });
            }
            else if (!isNumOnly) {
                mobileNumberControl.setErrors({ checkZeroPosition: true });
            }

            else if (checkValueOfMobileNumControl(mobileNumberControl)) {
                let valu = mobileNumberControl.value.replace(/^.{2}/g, '+');
                mobileNumberControl.setValue(valu);
            } else if (checkOperatorInMobileNumControl(mobileNumberControl)) {
                mobileNumberControl.setErrors({ checkZeroPosition: true });
            }
            else if (checkValueAndOperatorInMobileNumControl(mobileNumberControl)) {
                mobileNumberControl.setErrors({ checkZeroPosition: true });
            }
            else
                checkLengthOfMobileNumberControl(mobileNumberControl, plusCount);
        } else {
            mobileNumberControl.setErrors(null);

        }
    }
}

function checkValueOfMobileNumControl(mobileNumberControl) {
    return mobileNumberControl.value != "" && mobileNumberControl.value.charAt(0) == "0" && mobileNumberControl.value.charAt(1) == "0";
}

function checkOperatorInMobileNumControl(mobileNumberControl) {
    return mobileNumberControl.value != "" && mobileNumberControl.value.charAt(0) == "+" && mobileNumberControl.value.charAt(1) == "+";
}

function checkValueAndOperatorInMobileNumControl(mobileNumberControl) {
    return mobileNumberControl.value != "" && mobileNumberControl.value.charAt(0) == "0" && mobileNumberControl.value.charAt(1) == "+";
}

function checkLengthOfMobileNumberControl(mobileNumberControl, plusCount) {
    if (mobileNumberControl.value != "" && mobileNumberControl.value.length < 11) {
        mobileNumberControl.setErrors({ checkZeroPosition: true });
    } else if (plusCount > 1) {
        mobileNumberControl.setErrors({ checkZeroPosition: true });
    }
    else if (mobileNumberControl.value != "" && mobileNumberControl.value.charAt(0) != "0") {
        if (mobileNumberControl.value.charAt(0) != "+") {

            mobileNumberControl.setErrors({ checkZeroPosition: true });
        }
        if (mobileNumberControl.value.charAt(0) != "0" && mobileNumberControl.value.charAt(0) != "+") {
            mobileNumberControl.setErrors({ checkZeroPosition: true });
        }
    }
    else {
        mobileNumberControl.setErrors(null);
    }
}

export function CheckForLetterPresence(e: KeyboardEvent, mobileField: AbstractControl) {

    if (e.key === "Backspace" && mobileField.value.length < 1 && mobileField.hasError('letterError')) {
        mobileField.setErrors(null);
    }
}

export function CheckMoreThanOneSpecialCharachter(controlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        let spclChrCount = 0;
        let splChars = "!,-_.@;:$%^[\\]?=>/<";
        if (control.errors && !control.errors.specialCharMoreThanOne) {
            // return if another validator has already found an error on the matchingControl
            return;
        }

        for (let i = 0; i < control.value.length; i++) {
            if (splChars.indexOf(control.value.charAt(i)) != -1) {
                spclChrCount++;
            }
        }
        // set error on matchingControl if validation fails
        if (spclChrCount == 0) {
            control.setErrors({ specialCharMoreThanOne: true });
        } else {
            control.setErrors(null);
        }
    }
}
export function NotMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        const matchingControl = formGroup.controls[matchingControlName];

        if (matchingControl.errors && !matchingControl.errors.notMatch) {
            // return if another validator has already found an error on the matchingControl
            return;
        }

        // set error on matchingControl if validation fails
        if (control.value == matchingControl.value) {
            matchingControl.setErrors({ notMatch: true });
        } else {
            matchingControl.setErrors(null);
        }
    }
}


export function CheckNectarCardLength(nectarControlName: string) {
    return (formGroup: FormGroup) => {
        const nectarcontrol = formGroup.controls[nectarControlName];
        if (nectarcontrol.errors && !nectarcontrol.errors.checkNectarIdLength) {
            // return if another validator has already found an error on the matchingControl
            return;
        }

        let digitCount = 0;
        let onlyNumbers = "0123456789";
        for (let i = 0; i < nectarcontrol.value.length; i++) {
            if (onlyNumbers.indexOf(nectarcontrol.value.charAt(i)) != -1) {
                digitCount++;
            }
        }
        // set error on matchingControl if validation fails
        if (digitCount > 0 && digitCount < 11) {
            nectarcontrol.setErrors({ checkNectarIdLength: true });
        } else {
            nectarcontrol.setErrors(null);
        }
    }
}

export function CheckMonth(controlName: any) {
    let months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];

        if (control.value.length === 1) {
            if (control.value === "0" || (months.indexOf(`0${control.value}`) < 0)) {

                control.setErrors({ monthError: true });
            }
            else {
                control.setErrors(null);
            }
        }
        else if (control.value.length === 2) {
            if (months.indexOf(`${control.value}`) < 0) {
                control.setErrors({ monthError: true });

            }
            else {
                control.setErrors(null);
            }
        }
    }
}


export function CheckYear(controlName: string, controlName2: string) {

    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        const mControl = formGroup.controls[controlName2];

        if (control.errors) {
            return;
        }
        if (control.value && (Number.isNaN(control.value) || (!Number(control.value)))) {
            control.setErrors({ yearError: true });

        }
        let currentYr = new Date().getFullYear();
        if (control.value.length === 4) {
            let currentMonth = new Date().getMonth() + 1;
            if (Number(control.value) == currentYr && Number(mControl.value) > currentMonth) {
                mControl.setErrors({ monthError: true });
            }

            else if ((Number(control.value) <= Number(1900)) || (Number(control.value) >= currentYr)) {
                control.setErrors({ yearError: true });
            }
        }
        if (control.value.length > 0 && control.value.length < 4) {
            control.setErrors({ yearError: true });


        }
    }
}

export function checkUserName(controlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];

        if (control.errors) {
            return;
        }
        let Regex = /[^a-zA-Z-]+/g;
        if (Regex.test(control.value)) {
            let newval = control.value.replace(/[^a-zA-Z-]+/g, "");
            control.setValue(newval);
        }
        if (/[^a-z]/i.test(control.value[0]) || control.value === "") {
            control.setErrors({ pattern: true });
        }
        else {
            control.setErrors(null);
        }
    }
}

export function checkNameValidator(controlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        if (control.errors) {
            return;
        }
        let Regex = /[A-Za-z 'àéèìòùäëïöüçÀÄÈËÌÏÒÖÙÜ-]+/g;
        if (Regex.test(control.value)) {
            let values = control.value.split('');
            for (let value of values) {
                if (!value.match(/[A-Za-z 'àéèìòùäëïöüçÀÄÈËÌÏÒÖÙÜ-]+/g)){
                    let newval = control.value.replaceAll(/[^A-Za-z 'àéèìòùäëïöüçÀÄÈËÌÏÒÖÙÜ-]+/g, "");
                    control.setValue(newval);
                }
            }
        }

        // allow only 50 char
        const currentValuesArray = control.value.split('');
        if (currentValuesArray.length > 50) {
            let tempValue = [];
            // get only 50 char
            for (let i = 0; i < 50; i++) {
                tempValue.push(currentValuesArray[i]);
            }
            // set new value with only 50 char
            control.setValue(tempValue.join(''));
            control.setErrors(null);
        }



        if (/[^A-Za-z 'àéèìòùäëïöüçÀÄÈËÌÏÒÖÙÜ-]/g.test(control.value[0]) || control.value === "") {
            control.setErrors({ pattern: true });
        }
        else {
            control.setErrors(null);
        }
    }
}

export function validateEmailRegex(controlName) {

    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        if (control.errors && !control.errors.specialCharMoreThanOne) {
            // return if another validator has already found an error on the matchingControl
            return;
        }
        const emailRegex = /^(?![!#$%&'*+/=?^_`{|}˜])[a-zA-Z0-9!#$%&'*+/=?^_`{|}˜-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}˜-]+)*@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

        if (!control.value || emailRegex.test(control.value)) {
          control.setErrors(null); // Valid Email
        }else{
            control.setErrors({ emailRegexError : true }); //  Invalid Email
        }
    };
  }
