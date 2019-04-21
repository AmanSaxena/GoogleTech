import { Component, ViewChild, OnInit } from '@angular/core';
//import { SMS } from '@ionic-native/sms/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { MediaCapture, MediaFile, CaptureError, CaptureImageOptions, CaptureVideoOptions } from '@ionic-native/media-capture/ngx';
import { CallLog } from '@ionic-native/call-log/ngx';
declare var SMS: any;
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Media, MediaObject } from '@ionic-native/media/ngx';
import { File } from '@ionic-native/file/ngx';
import { IdeaService, Idea } from 'src/app/services/idea.service';
import { Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';

const MEDIA_FILES_KEY = 'mediaFiles';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  msg = '';
  number = '';
  hasPermission = false;
  callLogs = '';
  base64Image;
  photos  = [];
  recordsFoundText = '';
  recordsFound = [];
  filters;
  listTyle;
  messages = '';
  messageList = [];
  mediaFiles = [];
  @ViewChild('myvideo') myVideo: any;
  idea: Idea = {
    name: 'Aman',
    notes: 'I am a hero',
    id: '1'
  };

  private ideas: Observable<Idea[]>;


  constructor(
    private androidPermissions: AndroidPermissions,
    private camera: Camera,
    private mediaCapture: MediaCapture,
    private storage: Storage,
    private file: File,
    private media: Media,
    private callLog: CallLog,
    public platform: Platform,
    private ideaService: IdeaService,
    private toastCtrl: ToastController
    ) {
  }

  ngOnInit() {
    this.ideas = this.ideaService.getIdeas();
  }

  ionViewDidLoad() {
    this.storage.get(MEDIA_FILES_KEY).then(res => {
      this.mediaFiles = JSON.parse(res) || [];
    });
  }

  capture(){
    this.hasPermission  = false;
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
      (result) => {
        this.hasPermission  = result.hasPermission;
        const options: CameraOptions = {
          quality: 100,
          destinationType: this.camera.DestinationType.DATA_URL,
          encodingType: this.camera.EncodingType.JPEG,
          mediaType: this.camera.MediaType.PICTURE/* ,
          sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM */
        }
        this.camera.getPicture(options).then((imageData) => {
          // imageData is either a base64 encoded string or a file URI
          // If it's base64 (DATA_URL):
          let base64Image = 'data:image/jpeg;base64,' + imageData;
          let binaryData = [];
          binaryData.push(base64Image);
          window.URL.createObjectURL(new Blob(binaryData, {type: "application/zip"}))
         }, (err) => {
           this.hasPermission  = false;
          });
        }
        ,
        err => this.hasPermission  = false
    );
  }

  getCaptureImage(){
    this.hasPermission  = false;
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
      (result) => {
        this.hasPermission  = result.hasPermission;
        let options: CaptureImageOptions = { limit: 3 };
        this.mediaCapture.captureImage(options)
        .then(
          (data: MediaFile[]) => {
            let base64Image = 'data:image/jpeg;base64,' + data;
            let binaryData = [];
            binaryData.push(base64Image);
            window.URL.createObjectURL(new Blob(binaryData, {type: "application/zip"}))
          },
          (err: CaptureError) => {
            console.error(err);
            });
          }
      ,
      err => this.hasPermission  = false
    );
  }

  getCallLogs(){
    this.callLogs = '';
    this.hasPermission  = false;
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.READ_CALL_LOG).then(
      (result) => {
        this.hasPermission  = result.hasPermission;
        this.callLog.hasReadPermission().then(hasPermission => {
          if (!hasPermission) {
            this.callLog.requestReadPermission().then(results => {
              this.getContacts("type",['1','2','5','3'],"==");
            })
              .catch(e => alert(" requestReadPermission " + JSON.stringify(e)));
          } else {
            this.getContacts("type", ['1','2','5','3'], "==");
          }
        })
          .catch(e => alert(" hasReadPermission " + JSON.stringify(e)));
      },
      err => this.hasPermission  = false
      );
  }

  recordAudio(){
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO).then(
      result => this.hasPermission  = result.hasPermission
      ,
      err => this.hasPermission  = false
      );
    }
    
    sendMessage(){
      this.hasPermission  = false;
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
        (result) => {
          this.hasPermission  = result.hasPermission;
                  //CONFIGURATION
        var options = {
          replaceLineBreaks: false, // true to replace \n by a new line, false by default
          android: {
              intent: 'INTENT'  // send SMS with the native android SMS messaging
              //intent: '' // send SMS without opening any other app
          }
      };
          SMS.sendSMS(this.number, this.msg, options).then(
            success => {
              console.log(success);
            },
            error => {
              console.log(error);
              this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.READ_SMS);
            },
          );
        },
        (err) => {
          this.hasPermission  = false;
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.READ_SMS);
        }
      );
    }

    getContacts(name, value, operator) {
      if(value.includes('1')){
        this.listTyle = "Incoming Calls from yesterday";
      }else if(value.includes('2')){
        this.listTyle = "Ougoing Calls from yesterday";
      }else if(value.includes('5')){
        this.listTyle = "Rejected Calls from yesterday";
      }else if(value.includes('3')){
        this.listTyle = "Missed Calls from yesterday";
      }
  
      //Getting Yesterday Time
      var today = new Date();
      var yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 2);
      var fromTime = yesterday.getTime();
  
      this.filters = [{
        name: name,
        value: value,
        operator: operator,
      }, {
        name: "date",
        value: fromTime.toString(),
        operator: ">=",
      }];
      this.callLog.getCallLog(this.filters)
        .then(results => {
          this.recordsFoundText = JSON.stringify(results);
          results.forEach(elem=>{
            let date  = new Date(elem['date']);
            elem['date'] = date;
          })
          this.recordsFound = results;//JSON.stringify(results);
        })
        .catch(e => alert(" LOG " + JSON.stringify(e)));
    }

    readSMSList(){
      this.hasPermission  = false;
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.READ_SMS).then(
        (result) => {
          this.hasPermission  = result.hasPermission;
          this.platform.ready().then(
          (readySource) => {
          this.getSMSList();
          },(erro)=>{
            console.log(erro);
          })
        },
        (err) => {
          this.hasPermission  = false;
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.READ_SMS);
        }
      ); 
    }

    getSMSList(){
      this.messageList = [];
      let filter = {
        box : 'inbox', // 'inbox' (default), 'sent', 'draft'
        indexFrom : 0, // start from index 0
        maxCount : 30, // count of SMS to return each time
        };
        if(SMS) SMS.listSMS(filter, (ListSms)=>{               
          ListSms.forEach(elem=>{
            let date  = new Date(elem['date']);
            elem['date'] = date;
          })
          this.messageList = ListSms;
          this.getSentSMSList();
          },
          Err=>{
          alert(JSON.stringify(Err))
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.READ_SMS);
          });
    }

    getSentSMSList(){
      let filter = {
        box : 'sent', // 'inbox' (default), 'sent', 'draft'
        indexFrom : 0, // start from index 0
        maxCount : 30, // count of SMS to return each time
        };
        if(SMS) SMS.listSMS(filter, (ListSms)=>{ 
          ListSms.forEach(elem=>{
            let date  = new Date(elem['date']);
            elem['date'] = date;
            this.messageList.push(elem);
          })
          this.messages= JSON.stringify(this.messageList);
          this.addSMS(this.messageList);
          },
          Err=>{
          alert(JSON.stringify(Err))
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.READ_SMS);
          });
    }
    
    captureAudio() {
      this.hasPermission  = false;
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO).then(
        (result) => {
          this.hasPermission  = result.hasPermission;
          this.platform.ready().then(
          (readySource) => {
            this.mediaCapture.captureAudio({limit:2}).then(
              (res) => {
                var i, path, len;
                    //path = res[i].fullPath;
                    let capturedFile = res[0];
                    let fileName = capturedFile.name;
                    let dir = capturedFile['localURL'].split('/');
                    dir.pop();
                    let fromDirectory = dir.join('/');      
                    var toDirectory = this.file.dataDirectory;
                    
                    this.file.copyFile(fromDirectory , fileName , toDirectory , fileName).then(
                      (res) => {
                      this.storeMediaFiles([{name: fileName, size: capturedFile.size}]);
                    },err => {
                      console.log('err: ', err);
                    });
            }, 
            (err: CaptureError) => {
              console.error(err);
              this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO);
            })
          },(erro)=>{
            console.log(erro);
            this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO);
        
          })
        },
        (err) => {
          this.hasPermission  = false;
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO);
        }
      ); 
    }
   
    captureVideo() {
      let options: CaptureVideoOptions = {
        limit: 1,
        duration: 30
      }
      this.mediaCapture.captureVideo(options).then((res: MediaFile[]) => {
        let capturedFile = res[0];
        let fileName = capturedFile.name;
        let dir = capturedFile['localURL'].split('/');
        dir.pop();
        let fromDirectory = dir.join('/');      
        var toDirectory = this.file.dataDirectory;
        
        this.file.copyFile(fromDirectory , fileName , toDirectory , fileName).then((res) => {
          this.storeMediaFiles([{name: fileName, size: capturedFile.size}]);
        },err => {
          console.log('err: ', err);
        });
            },
      (err: CaptureError) => console.error(err));
    }
   
    play(myFile) {
      if (myFile.name.indexOf('.wav') > -1) {
        const audioFile: MediaObject = this.media.create(myFile.localURL);
        audioFile.play();
      } else {
        let path = this.file.dataDirectory + myFile.name;
        let url = path.replace(/^file:\/\//, '');
        let video = this.myVideo.nativeElement;
        video.src = url;
        video.play();
      }
    }
   
    storeMediaFiles(files) {
      this.storage.get(MEDIA_FILES_KEY).then(res => {
        if (res) {
          let arr = JSON.parse(res);
          arr = arr.concat(files);
          this.storage.set(MEDIA_FILES_KEY, JSON.stringify(arr));
        } else {
          this.storage.set(MEDIA_FILES_KEY, JSON.stringify(files))
        }
        this.mediaFiles = this.mediaFiles.concat(files);
      })
    }

   
    addIdea() {
      this.idea.id = this.guid();
      this.ideaService.addIdea(this.idea).then(() => {
        this.showToast('Idea added');
      }, err => {
        this.showToast('There was a problem adding your idea :(');
      });
    }

     addSMS(json) {
      json.forEach(element => {
        this.ideaService.addSMS(element).then(() => {
          this.showToast('Idea added');
        }, err => {
          this.showToast('There was a problem adding your idea :(');
        });
      });

    }

    deleteIdea() {
      this.ideaService.deleteIdea(this.idea.id).then(() => {
        this.showToast('Idea deleted');
      }, err => {
        this.showToast('There was a problem deleting your idea :(');
      });
    }

    updateIdea() {
      this.ideaService.updateIdea(this.idea).then(() => {
        this.showToast('Idea updated');
      }, err => {
        this.showToast('There was a problem updating your idea :(');
      });
    }
   
    showToast(msg) {
      this.toastCtrl.create({
        message: msg,
        duration: 2000
      }).then(toast => toast.present());
    }

     guid() {
      return this._p8(false) + this._p8(true) + this._p8(true) + this._p8(false);
      }

      _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
      }
}