import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; 
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WebService } from '../../servicios/web.service';
import { IPlanillaCanDeactivate } from '../../guard/iplanilla-candeactivate';
declare var swal:any;

@Component({
    selector: 'app-modificarPlanilla',
  	templateUrl: './modificar-planilla.component.html',
  	styleUrls: ['./modificar-planilla.component.css'],
  	providers: [WebService]
})

export class ModificarPlanillaComponent implements OnInit, IPlanillaCanDeactivate {
	
	unsavedChanges:boolean = false;
	id_dia:number = -1;
	id_turno_inicio:number = -1;
	id_turno_fin:number = -1;
	id_cargo:number = -1;
	id_funcionario:number = -1;
	diaSeleccionado = -1;
	turnoSeleccionado = -1;
	funcionarios = {};
	objectKeys = Object.keys;
	cargos = [];
	diasSemana = [];
	planilla = null;
	turnosModal:any[] = [];

	constructor(private webService:WebService, private route: ActivatedRoute, private router:Router, private modalService:NgbModal){}

	ngOnInit(){
		this.cargos = ['Administrativo','Tens','Matron(a)','Lab Biología','Lab Andrología'];
		this.diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
		this.webService.obtenerFuncionarios()
			.subscribe(resFuncionarios => 
				resFuncionarios.forEach(elemento => {
					this.funcionarios[elemento._id] = elemento;
					this.funcionarios[elemento._id].horas = 0;
					this.funcionarios[elemento._id].horasIniciales = 0;
				})
			);
		this.route.params.subscribe(params => this.webService.obtenerPlanilla(new Date(params['id'])).
			subscribe(resPlanilla => {
				this.planilla = resPlanilla;
				this.planilla.dias.forEach(dia=>dia.turnos.forEach(turno=>{
					if(this.funcionarios[turno.funcionario] !== undefined)
						this.funcionarios[turno.funcionario].horas += turno.duracion;
						this.funcionarios[turno.funcionario].horasIniciales += turno.duracion;
				}));
			}));
	}

	modificarPlanilla(){
		this.unsavedChanges = false;
		this.objectKeys(this.funcionarios).forEach(key=>{
			this.funcionarios[key].horasAcumuladas+=this.funcionarios[key].horas-this.funcionarios[key].horasIniciales;
			this.webService.modificarFuncionario(this.funcionarios[key]).subscribe();
		});
		this.webService.modificarPlanilla(this.planilla).subscribe(null,null,()=>this.router.navigate(['/planillas/mostrar']));
	}

	agregarTurno(){
		if(this.comprobarSeleccion()){
			if(this.comprobarTurno(this.id_dia,this.id_turno_inicio,this.id_turno_fin,this.objectKeys(this.funcionarios)[this.id_funcionario])){
				if(this.funcionarios[this.objectKeys(this.funcionarios)[this.id_funcionario]].horas<44){
					this.unsavedChanges = true;
					this.funcionarios[this.objectKeys(this.funcionarios)[this.id_funcionario]].horas += this.id_turno_fin - this.id_turno_inicio;
					var turnObj = {funcionario:this.objectKeys(this.funcionarios)[this.id_funcionario],inicio:Number(this.id_turno_inicio),duracion:this.id_turno_fin - this.id_turno_inicio};
					this.planilla.dias[this.id_dia].turnos.push(turnObj);
					this.resetIds();
				}else
					swal({
			            text: 'Éste funcionario cumplió las 44 horas. ¿Estás seguro de añadirle un nuevo turno?',
			            type: 'warning',
			            allowOutsideClick: false,
			            allowEscapeKey: false,
			            allowEnterKey: false,
			            showCancelButton: true,
			            reverseButtons: true,
			            showCloseButton: true,
			            confirmButtonText: 'Aceptar',
			            cancelButtonText: 'Cancelar',
			            confirmButtonColor: 'green',
					    cancelButtonColor: 'red'
			        }).then((isOk: boolean) => {
			            if(isOk){
			            	this.unsavedChanges = true;
							this.funcionarios[this.objectKeys(this.funcionarios)[this.id_funcionario]].horas += this.id_turno_fin - this.id_turno_inicio;
							var turnObj = {funcionario:this.objectKeys(this.funcionarios)[this.id_funcionario],inicio:Number(this.id_turno_inicio),duracion:this.id_turno_fin - this.id_turno_inicio};
							this.planilla.dias[this.id_dia].turnos.push(turnObj);
							this.resetIds();
			            }
			        },(dismiss)=>console.log("Modal dismiss by",dismiss));
			}else
				swal({title: 'Oops...',text: 'Éste funcionario ya se encuentra en éste turno',type: 'error',allowOutsideClick: false,allowEscapeKey: false,allowEnterKey: false,showCloseButton: true});
		}else
			swal({title: 'Oops...',text: 'Seleccione un valor para cada campo',type: 'error',allowOutsideClick: false,allowEscapeKey: false,allowEnterKey: false,showCloseButton: true});
	}

	eliminarTurno(dia,turnoIndex,idx){
		this.unsavedChanges = true;
		var turno = this.planilla.dias[dia].turnos[turnoIndex];
		this.funcionarios[turno.funcionario].horas -= turno.duracion;
		this.planilla.dias[dia].turnos.splice(turnoIndex,1);
		this.turnosModal.splice(idx,1);
	}

	detalleTurno(dia,turno,modal){
		this.turnosModal.length = 0; //Limpia arr modal
		var turnos = this.planilla.dias[dia].turnos.filter(function(t){return (t.inicio === turno || (Number(t.inicio+t.duracion) > turno) && t.inicio < turno)});
		if(turnos.length!==0){
			this.diaSeleccionado = dia;
			this.turnoSeleccionado = turno;
			for(let i = 0;i<turnos.length;++i) {
				this.turnosModal.push({
					nombre:this.funcionarios[turnos[i].funcionario].nombre,
					cargo:this.funcionarios[turnos[i].funcionario].cargo,
					inicio:(turnos[i].inicio+8)+":00",
					fin:(turnos[i].inicio+turnos[i].duracion+8)+":00",
					idx:Number(this.planilla.dias[dia].turnos.indexOf(turnos[i]))
				});
			}
			this.modalService.open(modal,{size:'lg'});
		}
	}

	comprobarTurno(dia,inicio,fin,funcionario) {
		var turnos:any[] = this.planilla.dias[dia].turnos.filter(function(a) { 
			return a.funcionario == funcionario;
		});
		for(let i = 0; i < turnos.length;i++) {
			if(
				(inicio >= turnos[i].inicio && inicio < (turnos[i].inicio + turnos[i].duracion)) || 
				(fin > turnos[i].inicio && fin <= (turnos[i].inicio + turnos[i].duracion)) ||
				(inicio < turnos[i].inicio && fin > (turnos[i].inicio + turnos[i].duracion))
			)
				return false;
		}
		return true;
	}

	comprobarSeleccion(){
		return this.id_dia != -1 && this.id_turno_inicio != -1 && this.id_turno_fin != -1 && this.id_cargo != -1 && this.id_funcionario != -1;
	}

	resetIds(){
		this.id_dia = -1;
		this.id_turno_inicio = -1;
		this.id_turno_fin = -1;
		this.id_cargo = -1;
		this.id_funcionario = -1;
	}

	puedeDesactivar(){
		return !this.unsavedChanges;
	}

	fines(inicio:number):number[] {
		if(inicio===-1)
			return [];
		let a = [];
		for(let i = inicio; i < 9; i++) {
			a.push(Number(i)+1);
		}
		return a;
	}

	hayTurnos(n:number,dia:number) {
		var turnos = this.planilla.dias[dia].turnos.filter(function(t){return (t.inicio === n || (Number(t.inicio+t.duracion) > n) && t.inicio < n)})
		return turnos.length;
	}

}