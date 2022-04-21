import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';

/**
 * Generated class for the ChatPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})

export class ChatPage {
  @ViewChild(Content) content: Content;

  timeStamp = 0;
  data = { nick:'', message:'', timestamp:0 ,body: ''};
  chats = [];
  roomkey:string;
  nickname:string;
  nextTimeStamp:number = 0;
  url = '';

  constructor(private storage: Storage, public navCtrl: NavController, public navParams: NavParams, public http: HttpClient) {
    this.storage = storage;
    storage.get('nickname').then((val) => {
      if (val) {
        this.nickname = val;
      }
      else {
        this.nickname = generateNick();
      }
      console.log('NICKNAME: ' + val);
    });
    this.data.nick = '';
    this.data.timestamp = 0;

    console.log('Hello RestServiceProvider Provider');


    Observable.interval(3000)
      .mergeMap(()    =>  http.get(this.url + '/chat/' + this.timeStamp))
      .subscribe((chats: any[]) => {
        this.nextTimeStamp = this.timeStamp;  // Determine the latest message received so we can just ask for latest
        if (chats !== null) {
            console.log(`Retrieved ${chats.length} messages`);

            // Set the new timestamp for requesting messages
            this.nextTimeStamp = chats[chats.length-1].timestamp + 1;

            // Filter out my own chats from API since page reloaded
            if (this.timeStamp > 0) {
              chats = chats.filter(chat => chat.nick !== this.nickname);
            }

          // If there are chats, add them to the page
          if (chats !== null) {
            console.log(`Got Chats Ending at ${this.timeStamp}`);
            console.log(chats);
            this.chats = this.chats.concat(chats);
            this.content.scrollToBottom(500);
          }
          this.timeStamp = this.nextTimeStamp;  // Now set the global variable for the next timestamp to request
          console.log(`Setting timestamp for messages retrieval to: ${this.timeStamp}`);
        }
        else {
          console.log(`No Messages Pending`);
        }
      },
      (err) => {
        console.log(err);
      });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ChatPage');
  }

  goHome() {
    this.navCtrl.push('HomePage');
  }

  sendMessage() {
    this.nickname = this.data.nick || this.nickname;
    this.data.nick = this.nickname;
    this.storage.set('nickname', this.nickname);
    const headers = { 'content-type': 'application/json'}

    this.http.put(this.url + '/chat/', this.data, {'headers': headers}).subscribe(response => {
    }, err => {
      console.log(err);
    });

    this.data.timestamp = Date.now() / 1000;
    console.log(`Sending: from ${this.data.nick}: ${this.data.body}`);
    this.chats.push(JSON.parse(JSON.stringify(this.data)));  // stringify and parse to copy the data
    this.data.body = '';  // Erase the current message field on the screen
    this.content.scrollToBottom(500);

  }

}

  const nickDictionary = 'alfeo,amino,adunc,adnan,amigo,aurar,alcis,assay,agama,ammon,abram,arawn,asset,andie,algae,adler,amora,athol,amati,amend,angst,ariel,abbot,aydin,abaci,aedes,agape,alvah,ansar,arbil,among,aphis,arcus,atilt,asura,added,afoul,avoca,amour,amish,ahull,amuck,aloha,armil,arrow,alpha,apnea,alate,avery,arcas,basov,bunch,benny,beset,buses,broca,biped,bedel,brunt,baden,bogle,barre,bocce,bigly,baulk,booty,bronx,bojer,bimah,breed,baser,blame,balkh,boyle,bilbo,bream,bevan,bread,bakst,butat,balmy,brans,badge,bluey,borax,barmy,bosun,bursa,blitz,blood,brome,bello,birse,berry,boots,bumph,barye,blier,badly,brale,chair,curet,colin,carny,charm,capet,cinch,credo,ceuta,cycad,cilix,cooch,cutin,coset,caput,cwtch,cadgy,capon,crepe,cosec,chosn,creon,cusco,cynic,conon,cosey,conic,cadiz,clone,cruor,campy,calla,child,coles,caper,ceder,caney,claro,clart,commy,clare,cutch,calif,cozad,cabby,chute,cavea,champ,cozie,douai,dwine,ditch,deary,dolly,doted,daces,delay,denis,droop,davys,debug,dares,dahna,ducat,dodgy,delta,degas,dubbo,daman,dildo,dyana,ducal,drier,damar,drain,dante,donus,derby,drago,dobie,druse,dobby,davis,decks,durra,daisy,dholl,damia,dandy,delis,dhole,dinge,death,donut,debag,debye,dyane,dough,eulis,erica,endow,egadi,ednie,evict,eiger,educe,elder,earom,ellas,esker,ellis,ewery,eddic,evert,evert,ephes,ethyl,epoch,ecart,etiam,eying,eagle,ebony,easel,ethic,encyc,eulee,erect,eably,edwin,enful,eddie,eater,erich,egger,endue,ewell,eared,embow,edict,eslie,elena,eskar,efrem,evang,emery,etrog,enzed,friml,finis,fagot,feria,flush,farce,fiber,fatty,furan,fiend,fundy,fluor,furry,fiona,fremd,flack,feral,felid,forme,fixed,fetor,flour,frons,forty,facer,forel,folie,flake,fomor,ferry,foram,filip,frank,foggy,fitly,focal,fuchs,fiord,fatah,forth,fanny,freyr,fetus,folly,falda,forby,focus,forge,fling,fecit,grani,genoa,gripe,gezer,goyim,gyral,gaine,gemma,groom,grain,grace,ganof,gaffe,grief,guyon,grosz,ganja,gosse,garda,ghost,gates,gowon,galah,grote,guest,gismo,gaius,gjuki,greco,giuba,gofer,gogra,garth,gassy,gizmo,gemel,gogga,gomel,gamer,gwent,goltz,glory,greer,gyron,gules,graft,gonof,gobbi,green,gooch,heath,hdqrs,herzl,hulky,horme,hodur,howie,horol,haunt,hotel,hosea,humus,heian,hadji,holey,hedin,helot,hansa,hsian,humph,hands,hanya,hooly,heder,heijo,hanky,herse,humic,hurry,hosel,hosta,hecht,hanno,horeb,hoard,herry,havoc,hanky,hiver,heady,halli,hagia,honan,hatty,hayes,haman,hydro,hadar,hence,hinge,icftu,issue,incog,irazu,ihram,islet,inset,infer,iliac,iraqi,incus,issei,ieper,inurn,icker,ismet,idola,iliad,iblis,idled,iulus,inert,ixtle,idaea,incur,itchy,impel,iapyx,imbed,inorg,ivory,irbil,itnez,immix,ileus,imply,inuit,iceni,ictic,ilona,izard,ionic,imine,index,izzak,izmit,iduna,ioxus,iqbal,ikeja,jared,johns,jocko,jundy,jnana,jazey,jesse,jesus,joser,judas,jonel,judge,jaffa,junco,jakob,jolty,jupon,jemmy,juice,josep,junta,johor,jeans,junot,jerry,japur,jerid,jiber,johan,julia,jewry,jabal,jenny,judah,jerre,jihad,jebel,joeys,julio,jules,jacal,jamie,jahve,josef,joule,japan,jason,jakes,jinks,kiyas,konak,kandy,krone,khama,kinin,kloof,karri,kiddo,kench,kudos,knave,konig,khond,kyzyl,kofta,knute,kiaat,kindu,kohen,kurus,kulak,khnum,kilos,kraus,kazoo,koren,kurta,kaput,khios,karyn,kiowa,kauri,kotah,kerst,khmer,kepis,kazan,kirin,kasai,kauch,kerby,kebob,kaaba,korea,korma,kraft,khufu,kayos,kotow,leste,lords,light,loral,leigh,lingo,ladon,leros,lotto,loris,largo,laver,lowry,liszt,lauda,laval,lupus,lovey,litre,lazio,lathi,latke,lerne,lagos,loden,leafy,lumpy,lewis,licia,laxly,llama,lycia,lazar,luray,later,leggy,lundy,layer,lanky,lymph,loche,lochi,lummy,lunge,leary,luzon,ledgy,liang,lindy,liven,mutic,miner,miaou,modoc,moton,moire,mulch,merle,mster,mangy,merse,minot,micah,molal,missa,meung,meroe,midge,mosso,mound,madly,money,mason,mower,messy,mitre,mcfee,maudy,musky,marse,mysia,matlo,melun,medal,metol,macon,mesne,moray,matte,moser,maker,metty,marfa,mamor,moity,meant,moody,mucic,nagor,nevis,newly,nifty,nappy,nyoro,noted,nufud,nalgo,nugae,nowed,nutty,naked,nurse,nigel,ndola,nizam,numen,noose,narev,nyasa,nauch,nitid,north,neiva,nylon,nitro,nervy,neagh,nusku,natal,niobe,nixon,nevus,notum,namer,nerol,nikos,nikon,nival,netta,nosey,nasby,nitti,nerts,noble,newel,nanak,nodal,omega,onlap,otter,orczy,obote,oruro,ostia,olden,onlay,ozzie,ovine,octal,onion,often,ophir,okapi,orbit,ounce,ochoa,ouija,ousel,orang,opera,opera,oleum,oscar,otaru,ogive,olive,oddly,ocrea,odell,othin,ovolo,orach,ossia,osler,oaken,ossie,oxide,oldie,ought,olive,oncer,orlin,orlet,ovary,obole,oecus,plata,prahu,pfalz,price,piano,possy,pewit,phyfe,paddy,pilei,piau,prill,porch,pyran,purer,piman,plume,prude,panda,peise,perse,panga,pommy,potty,pigmy,pricy,piaui,peary,pills,poria,pinky,ponca,pacer,patmo,pussy,petra,pogey,plato,pygmy,pigmy,privy,phaye,pound,panto,poilu,paste,podia,polit,pilos,pilch,quiff,quick,quoit,quirt,quake,quill,quant,quean,qualm,quiet,quaky,quite,quaff,quire,quale,quits,quint,qibla,quest,quito,quass,quino,quash,qishm,quirk,quill,quell,quack,quail,queue,quilt,quist,quoth,queen,quote,quern,quant,quare,qeshm,quart,qatar,query,quinn,queer,quoin,quipu,quota,quark,refed,ryder,ratio,rabia,rawly,rocky,reeky,reast,ramal,rhein,regan,royal,ratin,racon,rahab,rondo,rearm,rebel,ritzy,rated,resit,royal,runed,rebec,ratal,rafvr,ricky,rainy,reich,repin,ronin,robin,repub,rishi,rizar,rewet,resew,rewed,recti,repro,reist,retie,remix,rayah,romeo,raton,rumen,round,revet,sumac,stalk,slung,sixmo,scrag,sabin,smoke,smite,satin,sprue,sheaf,steek,sacha,soane,slier,sapid,shoer,spahi,senna,sruti,sangh,soong,spoon,sigil,spook,south,silky,seely,stech,space,spasm,small,saida,swang,stomp,showa,spoke,spica,salic,slote,shake,sculk,snarl,spear,storm,syene,sumer,stoke,sooth,sammy,tyche,taegu,toile,tribe,turco,trone,truss,tezel,toxic,titty,tawse,taney,trent,thank,tansy,torah,tails,table,teary,tonne,trier,taata,terry,talys,tarde,tigon,tosca,trouv,tours,tutti,thira,tying,tasse,tubby,tanga,toyer,turfy,thong,tided,these,teeth,tepal,theca,trout,tafia,tebet,tryst,terra,tapas,tenth,unify,udine,usher,undry,usbek,unlay,unhit,udder,urban,uredo,usher,using,unfit,upolu,uhuru,ulric,unbid,urgel,usurp,utile,uller,under,unmet,upton,udall,unary,uriah,udgel,unshy,urate,unmad,utica,unwig,unrig,urial,unbox,usual,umber,urine,upper,unsly,uncut,ungot,uxmal,unpeg,unrwa,uvala,uncle,ushas,verge,viewy,vogel,vireo,vomer,valda,vedic,vigor,vpres,vimen,vined,visor,vitra,vixen,voces,vetch,vertu,vexil,volga,vowel,vapor,vogie,voice,vague,valid,varas,volap,vivid,vatic,voted,virtu,vodka,vikki,vocat,viola,varus,vacua,vidya,vinyl,vigny,vitae,virus,venal,varro,vitta,vidar,vegan,vajra,visit,whity,welch,wryly,wisla,where,wadai,wolfe,wersh,whiff,wrath,wolof,wrens,wryer,whiny,witan,wraac,write,windy,weest,wburg,wider,wells,wayne,wired,woody,wyatt,wurst,woody,weeds,woosh,while,wreck,waker,whaup,wight,worth,worms,wonna,wimpy,whips,wally,waugh,wadna,weeny,wodan,wheat,watts,xenon,xeres,xebec,xtian,xenia,xylic,xylan,xylyl,xeric,xerox,xylol,xenon,xhosa,xylem,yasna,young,yeats,yclad,yearn,yaqui,young,yucat,yeast,yabby,yavar,yodel,yuman,yahwe,yauld,yssel,yenan,yapon,yetta,yasht,ysaye,yogic,yapur,yukon,yamen,yurev,yquem,yahoo,yerba,youth,yodle,yokel,yadim,yalta,yeuky,yeisk,yakut,yield,yacht,yapok,yassy,yonne,yasuo,yarak,yeysk,yucca,yulan,zoril,zetes,zupus,zarga,zaire,zippy,zoser,zonal,zelos,zayin,zohar,zelig,zloty,zakah,zombi,zomba,zadar,zebec,zogan,zooty,zaria,zebra,zebec,zilla,zakat,zamia,zeist,zadok,zowie,zelle,zonda,zoaea,zaire,zweig,zendo,zibet,zebra,zagut,zincy,zenia,zappa,zingy,zante,zelda,zesty,zooid,ziska,zinky,zella'.split(',')

  function generateNick() {
    let first = nickDictionary[Math.floor(Math.random() * (nickDictionary.length - 1))]
    let second = nickDictionary[Math.floor(Math.random() * (nickDictionary.length - 1))]
    let suffix = Math.floor(Math.random() * 98 + 10)
    return `${first.charAt(0).toUpperCase()}${first.slice(1)}${second.charAt(0).toUpperCase()}${second.slice(1)}${suffix}`
  }
