import { AbstractControl } from '@angular/forms';

export class CelValidator {
	
	static verificarFormatoCel(c:AbstractControl){
		let regExpCel = /^[0-9]{11}$/;
		if(regExpCel.test(c.value))return null;
		return {formatoIncorrecto:true};
	}

}