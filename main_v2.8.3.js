// ----------------------------------------------------//
// Se crean las instancias de las librerias a utilizar //
// ----------------------------------------------------//
try{
var modbus = require('jsmodbus');
var fs = require('fs');
var PubNub = require('pubnub');

//Asignar host, puerto y otros par ametros al cliente Modbus
var client = modbus.client.tcp.complete({
    'host': "192.168.20.11",
    'port': 502,
    'autoReconnect': true,
    'timeout': 60000,
    'logEnabled'    : true,
    'reconnectTimeout': 30000
}).connect();
//var args, data;
var Barcode,secBarcode=0;
var intId,timeStop=40,flagONS1=0,flagONS2=0,flagONS3=0,flagONS4=0,flagONS5=0,flagONS6=0;
var BottlerSorter,BottlerOrientator,FillerCapper, Labeller,Shrinkwrapper,BottleSeparator, EOL,Printer,checkWeigher,Tapper,CounterCaps,Palletisacion;
var secBottlerSorter=0,secBottlerOrientator=0,secFillerCapper=0, secLabeller=0,secShrinkwrapper=0,secBottleSeparator=0, secEOL=0,secPrinter=0,seccheckWeigher=0;
var secTapper=0;
var auxStateBottlerSorter=0,auxStateBottlerOrientator=0,auxStateFillerCapper=0,auxStateLabeller=0, auxStateShrinkwrapper=0, auxStateBottleSeparator=0, auxStateEOL=0;
var auxStatePrinter=0,auxStatecheckWeigher=0, auxStateTapper;
var flagBottlerSorter=0, flagBottlerOrientator=0, flagFillerCapper=0, flagLabeller=0, flagShrinkwrapper=0, flagBottleSeparator=0, flagEOL=0;
var flagPrinter=0,flagcheckWeigher=0;
var tempCountPrinter=0, tempCountcheckWeigher=0, tempCountTapper;
var ctFillerCapper=0,actualFillerCapper=0,timeFillerCapper=0,stopCountFillerCapper=0,secFillerCapper=0,flagStopFillerCapper=0,stateFillerCapper=0,speedFillerCapper=0,speedTempFillerCapper=0,flagPrintFillerCapper=0;
var ctEOL=0,actualEOL=0,timeEOL=0,stopCountEOL=0,secEOL=0,flagStopEOL=0,stateEOL=0,speedEOL=0,speedTempEOL=0,flagPrintEOL=0;
var ctPrinter=0,actualPrinter=0,timePrinter=0,stopCountPrinter=0,secPrinter=0,flagStopPrinter=0,statePrinter=0,speedPrinter=0,speedTempPrinter=0,flagPrintPrinter=0;
var ctcheckWeigher=0,actualcheckWeigher=0,timecheckWeigher=0,stopCountcheckWeigher=0,seccheckWeigher=0,flagStopcheckWeigher=0,statecheckWeigher=0,speedcheckWeigher=0,speedTempcheckWeigher=0,flagPrintcheckWeigher=0;
var ctTapper=0,actualTapper=0,timeTapper=0,stopCountTapper=0,secTapper=0,flagStopTapper=0,stateTapper=0,speedTapper=0,speedTempTapper=0,flagPrintTapper=0;
var ctCounterCaps=0,actualCounterCaps=0,timeCounterCaps=0,stopCountCounterCaps=0,secCounterCaps=0,flagStopCounterCaps=0,stateCounterCaps=0,speedCounterCaps=0,speedTempCounterCaps=0,flagPrintCounterCaps=0;
var ctLabeller=0,actualLabeller=0,timeLabeller=0,stopCountLabeller=0,secLabeller=0,flagStopLabeller=0,stateLabeller=0,speedLabeller=0,speedTempLabeller=0,flagPrintLabeller=0;
var speedFlag=0, statePalletisation=0;
var publishConfig;
var secPubNub=0;
var tempTimeLabeller = 0, tempTimeTapper = 0, tempTimeCheckweigher = 0, tempTimePrinter = 0, tempTimeEOL = 0, tempTimeFillerCapper = 0, tempTimeCounterCaps = 0


var files = fs.readdirSync("/home/pi/BYD_L6_LOGS/"); //Leer documentos
var text2send=[];//Vector a enviar
var i=0;

pubnub = new PubNub({
  publishKey : "pub-c-82cf38a9-061a-43e2-8a0f-21a6770ab473",
  subscribeKey : "sub-c-e14aa146-bab0-11e8-b6ef-c2e67adadb66",
  uuid : "bydgoszcz-L6-monitoring"
});
// --------------------------------------------------------- //
//Función que realiza las instrucciones de lectura de datos  //
// --------------------------------------------------------- //
function DoRead(){
    client.readHoldingRegisters(0,60).then(function(resp){
    	var dataBottlerSorter = switchData(resp.register[0],resp.register[1]),
    		dataBottlerOrientator = switchData(resp.register[2],resp.register[3]),
    		dataFillerCapper = switchData(resp.register[4],resp.register[5]),
    		dataLabeller = switchData(resp.register[6],resp.register[7]),
    		dataShrinkwrapper = switchData(resp.register[8],resp.register[9]),
    		dataBottleSeparator = switchData(resp.register[10], resp.register[11]),
        dataSensor = switchData(resp.register[12], resp.register[13]);
	      BottlerSorter={
          ST: stateMachine(dataBottlerSorter)//State Machine
        };
        BottlerOrientator={
          ST: stateMachine(dataBottlerOrientator)//State Machine
        };
        Shrinkwrapper = {
        	ST: stateMachine(dataShrinkwrapper)//State Machine
        };
        BottleSeparator = {
			    ST: stateMachine(dataBottleSeparator)//State Machine
		    };

//Labeller ----------------------------------------------------------------------------------------------------------------------
        ctLabeller = joinWord(resp.register[35],resp.register[34]);
        if(flagONS1==0){
            speedTempLabeller=ctLabeller;
            flagONS1=1;
        }
        if (secLabeller>=60){
            if(stopCountLabeller==0||flagStopLabeller==1){
               flagPrintLabeller=1;
                secLabeller=0;
                speedLabeller=ctLabeller-speedTempLabeller;
                speedTempLabeller=ctLabeller;
            }
            if(flagStopLabeller==1){
                timeLabeller=Date.now();
            }
        }
        secLabeller++;
        if(ctLabeller>actualLabeller){
            stateLabeller=1;//RUN
            if(stopCountLabeller>=timeStop){
                speedLabeller=0;
                flagPrintLabeller=1;
                secLabeller=0;
            }
            timeLabeller=Date.now();
            stopCountLabeller=0;
            flagStopLabeller=0;
        }else if(ctLabeller==actualLabeller){
            if(stopCountLabeller==0){
                timeLabeller=Date.now();
            }
            stopCountLabeller++;
            if(stopCountLabeller>=timeStop){
                stateLabeller=2;//STOP
                speedLabeller=0;
                if(flagStopLabeller==0){
                    flagPrintLabeller=1;
                    secLabeller=0;
                }
                flagStopLabeller=1;
            }
        }
        if(stateLabeller==2){
            speedTempLabeller=ctLabeller;
        }

        actualLabeller=ctLabeller;
        if(stateLabeller==2){
            if(dataLabeller[5]==1){
                stateLabeller=3;//Wait
            }else{
                if(dataLabeller[4]==1){
                    stateLabeller=4;//Block
                }
            }
        }
        Labeller = {
            ST: stateLabeller,
            CPQO: joinWord(resp.register[35],resp.register[34]),
			      CPQR: joinWord(resp.register[37],resp.register[36]),
            SP: speedLabeller
        };
        if(flagPrintLabeller==1){
          if (timeLabeller == tempTimeLabeller)
            timeLabeller = Date.now()
            for(var key in Labeller){
                fs.appendFileSync("/home/pi/BYD_L6_LOGS/pol_byd_Labeller_l6.log","tt="+timeLabeller+",var="+key+",val="+Labeller[key]+"\n");
            }
            flagPrintLabeller=0;
            tempTimeLabeller = timeLabeller
        }
//Labeller END -------------------------------------------------------------------------------------------------------------------

//Tapper ----------------------------------------------------------------------------------------------------------------------
        ctTapper = joinWord(resp.register[27],resp.register[26]);
        if(flagONS3==0){
            speedTempTapper=ctTapper;
            flagONS3=1;
        }
        if (secTapper>=60){
            if(stopCountTapper==0||flagStopTapper==1){
               flagPrintTapper=1;
               ////console.log(stateTapper);
                secTapper=0;
                speedTapper=ctTapper-speedTempTapper;
                speedTempTapper=ctTapper;
            }
            if(flagStopTapper==1){
                timeTapper=Date.now();
            }
        }
        secTapper++;
        ////console.log(secTapper);
        if(ctTapper>actualTapper){
            stateTapper=1;//RUN
            if(stopCountTapper>=timeStop){
                speedTapper=(ctTapper-speedTempTapper)*60;
                flagPrintTapper=1;
                ////console.log(stateTapper);
                secTapper=0;
            }
            timeTapper=Date.now();
            stopCountTapper=0;
            flagStopTapper=0;


        }else if(ctTapper==actualTapper){
            if(stopCountTapper==0){
                timeTapper=Date.now();
            }
            stopCountTapper++;
            if(stopCountTapper>=timeStop){
                stateTapper=2;//STOP
                speedTapper=0;
                if(flagStopTapper==0){
                    flagPrintTapper=1;
                    ////console.log(stateTapper);
                    secTapper=0;
                }
                flagStopTapper=1;
            }
        }
        if(stateTapper==2){
            speedTempTapper=ctTapper;
        }

        actualTapper=ctTapper;
        //console.log("Front of Tapper: "+dataSensor[14]);
        //console.log("Exit of Tapper: "+dataSensor[13]);
        if(stateTapper==2){
            if(dataSensor[14]==0 && dataSensor[11]==1){
                stateTapper=3;//Wait
            }else{
                /*if(dataSensor[14]==1 && dataSensor[13]==1){
                    stateTapper=4;//Block
                }*/
                if(dataSensor[11]==0){
                    stateTapper=4;//Block
                }
            }
        }

        Tapper = {
            ST: stateTapper,
            CPQO: joinWord(resp.register[27],resp.register[26]),
            SP: speedTapper
        };
        if(flagPrintTapper==1){
          if(timeTapper == tempTimeTapper)
            timeTapper = Date.now()
            for(var key in Tapper){
                fs.appendFileSync("/home/pi/BYD_L6_LOGS/pol_byd_Tapper_l6.log","tt="+timeTapper+",var="+key+",val="+Tapper[key]+"\n");
            }
            flagPrintTapper=0;
            tempTimeTapper = timeTapper
        }
//Tapper END -------------------------------------------------------------------------------------------------------------------

//checkWeigher -----------------------------------------------------------------------------------------------------------------
        ctcheckWeigher = joinWord(resp.register[23],resp.register[22]);
        if(flagONS4==0){
            speedTempcheckWeigher=ctcheckWeigher;
            flagONS4=1;
        }
        if (seccheckWeigher>=60){
            if(stopCountcheckWeigher==0||flagStopcheckWeigher==1){
               flagPrintcheckWeigher=1;
               ////console.log(statecheckWeigher);
                seccheckWeigher=0;
                speedcheckWeigher=ctcheckWeigher-speedTempcheckWeigher;
                speedTempcheckWeigher=ctcheckWeigher;
            }
            if(flagStopcheckWeigher==1){
                timecheckWeigher=Date.now();
            }
        }
        seccheckWeigher++;
        ////console.log(seccheckWeigher);
        if(ctcheckWeigher>actualcheckWeigher){
            statecheckWeigher=1;//RUN
            if(stopCountcheckWeigher>=30){//timeStopbls
              speedFlag=1;
                //speedcheckWeigher=(ctcheckWeigher-speedTempcheckWeigher)*60;
                //flagPrintcheckWeigher=1;
                ////console.log(statecheckWeigher);
                seccheckWeigher=0;
            }
            timecheckWeigher=Date.now();
            stopCountcheckWeigher=0;
            flagStopcheckWeigher=0;


        }else if(ctcheckWeigher==actualcheckWeigher){
            if(stopCountcheckWeigher==0){
                timecheckWeigher=Date.now();
            }
            stopCountcheckWeigher++;
            if(stopCountcheckWeigher>=30){//timeStop
                statecheckWeigher=2;//STOP
                speedcheckWeigher=0;
                if(flagStopcheckWeigher==0){
                    flagPrintcheckWeigher=1;
                    ////console.log(statecheckWeigher);
                    seccheckWeigher=0;
                }
                flagStopcheckWeigher=1;
            }
        }
        if(speedFlag==1){
          if(seccheckWeigher>=3){
            speedcheckWeigher=((ctcheckWeigher-speedTempcheckWeigher)*60)/3;
            flagPrintcheckWeigher=1;
            speedFlag=0;
          }
        }

        if(statecheckWeigher==2){
            speedTempcheckWeigher=ctcheckWeigher;
        }

        actualcheckWeigher=ctcheckWeigher;
            //console.log("Front of CheckWeigher: "+dataSensor[1]);
            //console.log("Exit of CheckWeigher: "+dataSensor[0]);
        if(statecheckWeigher==2){
            if(dataSensor[1]==0 && dataSensor[11]==1){
                statecheckWeigher=3;
            }else{
                /*if(dataSensor[1]==1 && dataSensor[0]==1){
                    statecheckWeigher=4;
                }*/
                if(dataSensor[11]==0){
                    statecheckWeigher=4;
                }
            }
        }
        checkWeigher = {
            ST: statecheckWeigher,
            CPQO: joinWord(resp.register[23],resp.register[22]),
			      CPQR: joinWord(resp.register[25],resp.register[24]),
            SP: speedcheckWeigher
        };
        if(flagPrintcheckWeigher==1){
          if(timecheckWeigher == tempTimeCheckweigher)
            timecheckWeigher = Date.now()
            for(var key in checkWeigher){
                fs.appendFileSync("/home/pi/BYD_L6_LOGS/pol_byd_checkWeigher_l6.log","tt="+timecheckWeigher+",var="+key+",val="+checkWeigher[key]+"\n");
            }
            flagPrintcheckWeigher=0;
            tempTimeCheckweigher = timecheckWeigher
        }
//checkWeigher END -------------------------------------------------------------------------------------------------------------
//Printer ----------------------------------------------------------------------------------------------------------------------
        ctPrinter = joinWord(resp.register[19],resp.register[18]);
        if(flagONS5==0){
            speedTempPrinter=ctPrinter;
            flagONS5=1;
        }
        if (secPrinter>=80){
            if(stopCountPrinter==0||flagStopPrinter==1){
               flagPrintPrinter=1;
               ////console.log(statePrinter);
                secPrinter=0;
                speedPrinter=ctPrinter-speedTempPrinter;
                speedTempPrinter=ctPrinter;
            }
            if(flagStopPrinter==1){
                timePrinter=Date.now();
            }
        }
        secPrinter++;
        ////console.log(secPrinter);
        if(ctPrinter>actualPrinter){
            statePrinter=1;//RUN
            if(stopCountPrinter>=60){//timeStop
                speedPrinter=(ctPrinter-speedTempPrinter)*60;
                flagPrintPrinter=1;
                ////console.log(statePrinter);
                secPrinter=0;
            }
            timePrinter=Date.now();
            stopCountPrinter=0;
            flagStopPrinter=0;


        }else if(ctPrinter==actualPrinter){
            if(stopCountPrinter==0){
                timePrinter=Date.now();
            }
            stopCountPrinter++;
            if(stopCountPrinter>=60){//timeStop
                statePrinter=2;//STOP
                speedPrinter=0;
                if(flagStopPrinter==0){
                    flagPrintPrinter=1;
                    ////console.log(statePrinter);
                    secPrinter=0;
                }
                flagStopPrinter=1;
            }
        }
        if(statePrinter==2){
            speedTempPrinter=ctPrinter;
        }

        actualPrinter=ctPrinter;
        /*console.log("Front of Printer: "+dataSensor[4]);
           console.log("Exit of Printer: "+dataSensor[3]);*/
        if(statePrinter==2){
            if(dataSensor[4]==0 && dataSensor[11]==1){
              //Entrada 4
              //Salida 3
                statePrinter=3;//WAIT
            }else{
                /*if(dataSensor[3]==1 && dataSensor[4]==1){
                    statePrinter=4;//BLOCK
                }*/
                if(dataSensor[11]==0){
                    statePrinter=4;//BLOCK
                }
            }
        }
        Printer = {
            ST: statePrinter,
            CPQO: joinWord(resp.register[19],resp.register[18]),
			      CPQR: joinWord(resp.register[21],resp.register[20]),
            SP: speedPrinter
        };
        if(flagPrintPrinter==1){
          if(timePrinter == tempTimePrinter)
           timePrinter = Date.now()
            for(var key in Printer){
                fs.appendFileSync("/home/pi/BYD_L6_LOGS/pol_byd_Printer_l6.log","tt="+timePrinter+",var="+key+",val="+Printer[key]+"\n");
            }
            flagPrintPrinter=0;
            tempTimePrinter = timePrinter
        }
//Printer END ------------------------------------------------------------------------------------------------------------
//EOL  -------------------------------------------------------------------------------------------------------------------
        ctEOL = joinWord(resp.register[17],resp.register[16]);
        if(flagONS2==0){
            speedTempEOL=ctEOL;
            flagONS2=1;
        }
        if (secEOL>=60){
            if(stopCountEOL==0||flagStopEOL==1){
				//console.log(ctEOL +' '+speedEOL);
               flagPrintEOL=1;
               ////console.log(stateEOL);
                secEOL=0;
                speedEOL=ctEOL-speedTempEOL;
                speedTempEOL=ctEOL;
            }
            if(flagStopEOL==1){
                timeEOL=Date.now();
            }
        }
        secEOL++;
        //console.log('SECEOL '+secEOL);
        //console.log('contador '+ctEOL);
        ////console.log(secEOL);
        if(ctEOL>actualEOL){
            stateEOL=1;//RUN
            if(stopCountEOL>=timeStop){
                speedEOL=0;
                flagPrintEOL=1;
                ////console.log(stateEOL);
                secEOL=0;
            }
            timeEOL=Date.now();
            stopCountEOL=0;
            flagStopEOL=0;


        }else if(ctEOL==actualEOL){
            if(stopCountEOL==0){
                timeEOL=Date.now();
            }
            stopCountEOL++;
            if(stopCountEOL>=timeStop){
                stateEOL=2;//STOP
                speedEOL=0;
                if(flagStopEOL==0){
                    flagPrintEOL=1;
                    ////console.log(stateEOL);
                    secEOL=0;
                }
                flagStopEOL=1;
            }
        }
        if(stateEOL==2){
            speedTempEOL=ctEOL;
        }

        actualEOL=ctEOL;

        EOL={
            EOL: joinWord(resp.register[17],resp.register[16]),
            //CPQI:       joinWord(resp.register[2], resp.register[3]),//Counter Product Quantity In
            //CPQO:       joinWord(resp.register[4], resp.register[5]),//Counter Product Quantity Out
            //CPQR:       joinWord(resp.register[4], resp.register[5]),//Counter Product Quantity Reject
            SP:     speedEOL
        };
            if(flagPrintEOL==1){
              if (timeEOL == tempTimeEOL)
                timeEOL = Date.now()
                for(var key in EOL){
                    fs.appendFileSync("/home/pi/BYD_L6_LOGS/pol_byd_EOL_l6.log","tt="+timeEOL+",var="+key+",val="+EOL[key]+"\n");
                }
                flagPrintEOL=0;
                tempTimeEOL = timeEOL
            }
//EOL  END-------------------------------------------------------------------------------------------------------------------
//FillerCapper --------------------------------------------------------------------------------------------------------------
        ctFillerCapper = joinWord(resp.register[31],resp.register[30]);
        if(flagONS6==0){
            speedTempFillerCapper=ctFillerCapper;
            flagONS6=1;
        }
        if (secFillerCapper>=60){
            if(stopCountFillerCapper==0||flagStopFillerCapper==1){
               flagPrintFillerCapper=1;
               ////console.log(stateFillerCapper);
                secFillerCapper=0;
                speedFillerCapper=ctFillerCapper-speedTempFillerCapper;
                speedTempFillerCapper=ctFillerCapper;
            }
            if(flagStopFillerCapper==1){
                timeFillerCapper=Date.now();
            }
        }
        secFillerCapper++;
        ////console.log(secFillerCapper);
        if(ctFillerCapper>actualFillerCapper){
            stateFillerCapper=1;//RUN
            if(stopCountFillerCapper>=timeStop){
                speedFillerCapper=0;
                flagPrintFillerCapper=1;
                ////console.log(stateFillerCapper);
                secFillerCapper=0;
            }
            timeFillerCapper=Date.now();
            stopCountFillerCapper=0;
            flagStopFillerCapper=0;


        }else if(ctFillerCapper==actualFillerCapper){
            if(stopCountFillerCapper==0){
                timeFillerCapper=Date.now();
            }
            stopCountFillerCapper++;
            if(stopCountFillerCapper>=timeStop){
                stateFillerCapper=2;//STOP
                speedFillerCapper=0;
                if(flagStopFillerCapper==0){
                    flagPrintFillerCapper=1;
                    ////console.log(stateFillerCapper);
                    secFillerCapper=0;
                }
                flagStopFillerCapper=1;
            }
        }
        if(stateFillerCapper==2){
            speedTempFillerCapper=ctFillerCapper;
        }

        actualFillerCapper=ctFillerCapper;

        FillerCapper = {
            ST: stateMachine(dataFillerCapper),
            CPQO: joinWord(resp.register[31],resp.register[30]),
            CPQR: joinWord(resp.register[33],resp.register[32]),
            SP: speedFillerCapper
        };

        if(flagPrintFillerCapper==1){
          if(timeFillerCapper == tempTimeFillerCapper)
            timeFillerCapper = Date.now()
            for(var key in FillerCapper){
                fs.appendFileSync("/home/pi/BYD_L6_LOGS/pol_byd_FillerCapper_l6.log","tt="+timeFillerCapper+",var="+key+",val="+FillerCapper[key]+"\n");
            }
            flagPrintFillerCapper=0;
            tempTimeFillerCapper = timeFillerCapper
        }
//FILLER CAPPER END -------------------------------------------------------------------------------------------------------------------

//CounterCaps --------------------------------------------------------------------------------------------------------------------
        ctCounterCaps = joinWord(resp.register[29],resp.register[28]);
        if(flagONS2==0){
            speedTempCounterCaps=ctCounterCaps;
            flagONS2=1;
        }
        if (secCounterCaps>=60){
            if(stopCountCounterCaps==0||flagStopCounterCaps==1){
               flagPrintCounterCaps=1;
               ////console.log(stateCounterCaps);
                secCounterCaps=0;
                speedCounterCaps=ctCounterCaps-speedTempCounterCaps;
                speedTempCounterCaps=ctCounterCaps;
            }
            if(flagStopCounterCaps==1){
                timeCounterCaps=Date.now();
            }
        }
        secCounterCaps++;
        ////console.log(secCounterCaps);
        if(ctCounterCaps>actualCounterCaps){
            stateCounterCaps=1;//RUN
            if(stopCountCounterCaps>=timeStop){
                speedCounterCaps=0;
                flagPrintCounterCaps=1;
                ////console.log(stateCounterCaps);
                secCounterCaps=0;
            }
            timeCounterCaps=Date.now();
            stopCountCounterCaps=0;
            flagStopCounterCaps=0;


        }else if(ctCounterCaps==actualCounterCaps){
            if(stopCountCounterCaps==0){
                timeCounterCaps=Date.now();
            }
            stopCountCounterCaps++;
            if(stopCountCounterCaps>=timeStop){
                stateCounterCaps=2;//STOP
                speedCounterCaps=0;
                if(flagStopCounterCaps==0){
                    flagPrintCounterCaps=1;
                    ////console.log(stateCounterCaps);
                    secCounterCaps=0;
                }
                flagStopCounterCaps=1;
            }
        }
        if(stateCounterCaps==2){
            speedTempCounterCaps=ctCounterCaps;
        }
        if(stateCounterCaps==2){
          if(dataSensor[10]==1){
            stateCounterCaps=4;
          }
        }
        if(Labeller.ST==2&&FillerCapper.ST==2){
          stateCounterCaps=2;
        }
        actualCounterCaps=ctCounterCaps;


        CounterCaps = {
            ST: stateCounterCaps,
            CPQO: joinWord(resp.register[29],resp.register[28]),
            SP: speedCounterCaps
        };
        if(flagPrintCounterCaps==1){
          if(timeCounterCaps == tempTimeCounterCaps)
            timeCounterCaps = Date.now()
            for(var key in CounterCaps){
                fs.appendFileSync("/home/pi/BYD_L6_LOGS/pol_byd_CounterCaps_l6.log","tt="+timeCounterCaps+",var="+key+",val="+CounterCaps[key]+"\n");
            }
            flagPrintCounterCaps=0;
            tempTimeCounterCaps = timeCounterCaps
        }
//CounterCaps END -------------------------------------------------------------------------------------------------------------

//Palletisacion ------------------------------------------------------------------------------------------------------------------------
  if(dataSensor[11]==1){
    statePalletisation=1;
  }else{
    statePalletisation=2;
  }
  Palletisacion = {
    ST: statePalletisation
  };
//Palletisacion END --------------------------------------------------------------------------------------------------------------------
//Barcode -------------------------------------------------------------------------------------------------------------
if(resp.register[40]==0&&resp.register[41]==0&&resp.register[42]==0&&resp.register[43]==0&&resp.register[44]==0&&resp.register[45]==0&&resp.register[46]==0&&resp.register[47]==0){
  Barcode='0';
}else {
  var dig1=hex2a(assignment(resp.register[40]).toString(16));
  var dig2=hex2a(assignment(resp.register[41]).toString(16));
  var dig3=hex2a(assignment(resp.register[42]).toString(16));
  var dig4=hex2a(assignment(resp.register[43]).toString(16));
  var dig5=hex2a(assignment(resp.register[44]).toString(16));
  var dig6=hex2a(assignment(resp.register[45]).toString(16));
  var dig7=hex2a(assignment(resp.register[46]).toString(16));
  var dig8=hex2a(assignment(resp.register[47]).toString(16));
  Barcode=dig1+dig2+dig3+dig4+dig5+dig6+dig7+dig8;
}
if(isNaN(Barcode)){
  Barcode = '0';
}
if(secBarcode>=60){
    writedataBarcode(Barcode,"pol_byd_barcode_l6.log");
    secBarcode=0;
}
secBarcode++;
//Barcode -------------------------------------------------------------------------------------------------------------
 if(secPubNub>=60*5){

   function idle(){
     i=0;
     text2send=[];
     for ( k=0;k<files.length;k++){//Verificar los archivos
       var stats = fs.statSync("/home/pi/BYD_L6_LOGS/"+files[k]);
       var mtime = new Date(stats.mtime).getTime();
       if (mtime< (Date.now() - (3*60*1000))&&files[k].indexOf("serialbox")==-1){
         flagInfo2Send=1;
         text2send[i]=files[k];
         i++;
       }
     }
   }
   secPubNub=0;
   idle();
   publishConfig = {
     channel : "BYD_Monitor",
     message : {
           line: "6",
           tt: Date.now(),
           machines: text2send
         }
   };
   senderData();
 }
 secPubNub++;
    });//END Client Read
}

function senderData(){
  pubnub.publish(publishConfig, function(status, response) {
});}

function stateMachine(data){
	if(data[7]==1){
		return 1;//RUN
	}
	if(data[6]==1){
		return 2;//STOP
	}
	if(data[5]==1){
		return 3;//WAIT
	}
	if(data[4]==1){
		return 4;//BLOCK
	}
	return 2;
}
function counterState(actual,temp){
	if(actual!=temp){
		return 1;
	}else {
		return 2;
	}
}
var assignment = function (val){
  var result;
  if(val<12336)
    result = "";
  else
    result = val;
    return result;
};

function hex2a(hex){
   var str = '';
   for (var i = 0; i < hex.length; i += 2)
   str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}
var writedataBarcode = function (barcode,nameFile){
    var timet=Date.now();
    fs.appendFileSync("/home/pi/BYD_L6_LOGS/"+nameFile,"tt="+timet+",var=bc"+",val="+barcode+"\n");
};
function writedata(varJson,nameFile){
    var data;
    var timet=Date.now();
    for(var key in varJson){
        fs.appendFileSync("/home/pi/BYD_L6_LOGS/"+nameFile,"tt="+timet+",var="+key+",val="+varJson[key]+"\n");
    }
}
function joinWord(num1,num2){
    var bits="00000000000000000000000000000000";
    var  bin1=num1.toString(2),
         bin2=num2.toString(2),
         newNum = bits.split("");

        for(var i=0;i<bin1.length;i++){
            newNum[31-i]=bin1[(bin1.length-1)-i];
        }
        for(var i=0;i<bin2.length;i++){
            newNum[15-i]=bin2[(bin2.length-1)-i];
        }
        bits=newNum.join("");
        return parseInt(bits,2);
}
function switchData(num1,num2){
    var bits="00000000000000000000000000000000";
    var  bin1=num1.toString(2),
        bin2=num2.toString(2),
        newNum = bits.split("");

        for(var i=0;i<bin1.length;i++){
            newNum[15-i]=bin1[(bin1.length-1)-i];
        }
        for(var i=0;i<bin2.length;i++){
            newNum[31-i]=bin2[(bin2.length-1)-i];
        }
        bits=newNum.join("");

        return bits;
}

var stop = function () {
    ///This function clean data
    clearInterval(intId);
};

var shutdown = function () {
    ///Use function STOP and close connection
    stop();
    client.close();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);


///*If client is connect call a function "DoRead"*/
client.on('connect', function(err) {
    setInterval(function(){
        DoRead();
    }, 1000);
    setInterval(function(){
        writedata(BottlerSorter,"pol_byd_BottlerSorter_l6.log");
        writedata(BottlerOrientator,"pol_byd_BottlerOrientator_l6.log");
        writedata(Shrinkwrapper,"pol_byd_Shrinkwrapper_l6.log");
        writedata(BottleSeparator,"pol_byd_BottleSeparator_l6.log");
        writedata(Palletisacion,"pol_byd_Palletisacion_l6.log");
    }, 60000);
});

///*If client is in a error ejecute an acction*/
client.on('error', function (err) {
    fs.appendFileSync("error.log","ID 1: "+Date.now()+": "+err+"\n");
    //console.log('Client Error', err);
});
///If client try closed, this metodo try reconnect client to server
client.on('close', function () {
    //console.log('Client closed, stopping interval.');
    fs.appendFileSync("error.log","ID 2: "+Date.now()+": "+'Client closed, stopping interval.'+"\n");
    stop();
});

}catch(err){
    fs.appendFileSync("error.log","ID 3: "+Date.now()+": "+err+"\n");
}
