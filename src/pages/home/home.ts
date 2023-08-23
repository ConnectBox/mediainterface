import { Component } from '@angular/core';
import { IonicPage, NavController, PopoverController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { take } from 'rxjs/operators/take';
import { LanguageProvider } from '@providers/language/language';
import { LiveConfigurationProvider } from '@providers/live-configuration/live-configuration';
import { MediaProvider } from '@providers/media/media';
import { GroupedMedia } from '@interfaces/grouped-media.interface';
import { Language } from '@models/language';
import { Media } from '@models/media';
import { LanguagePopoverComponent } from '@components/language-popover/language-popover';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  /**
   * Is chat enabled?
   */
  allowsChat = true;

  /**
   * Do we display the branded information?
   */
  displaysBranding = true;

  /**
   * Our media to display
   */
  groups: GroupedMedia = {};

  /**
   * The keys for groups (Remove Other)
   *
   */
  groupKeys: Array<string> = [];

  /**
   * The logo for the interface retrieved from the interface file.
   */
  logo: string = "imgs/logo.png";

  /**
   * A list of recommended media
   */
  recommended: Array<Media> = [];

  /**
   * A list of uncategorized media
   */
  others: Array<Media> = [];

  /**
   * The current language
   */
  private currentLanguage: Language = null;

  /**
   * Our stream for tracking changes on the language
   */
  private languageOnChangeStream$: any = null;

  constructor(
    private mediaProvider: MediaProvider,
    private navController: NavController,
    private languageProvider: LanguageProvider,
    private liveConfigurationProvider: LiveConfigurationProvider,
    private popoverController: PopoverController,
    private translateService: TranslateService,
  ) {}

  /**
   * Ionic LifeCycle the view will enter
   *
   * @return void
   */
  ionViewWillEnter() {
    this.languageProvider.getLanguage().pipe(take(1)).subscribe((lang: Language) => this.loadData(lang));
    this.languageOnChangeStream$ = this.languageProvider.onLanguageChange.subscribe((lang: Language) => this.loadData(lang));
    this.liveConfigurationProvider.init().pipe(take(1)).subscribe(()  =>  {
      this.allowsChat = this.liveConfigurationProvider.allowsChat;
      this.displaysBranding = this.liveConfigurationProvider.displayBranding;
    });
  }

  /**
   * Ionic LifeCycle the view will leave
   *
   * @return void
   */
  ionViewWillLeave() {
    if (this.languageOnChangeStream$) {
      this.languageOnChangeStream$.unsubscribe();
      this.languageOnChangeStream$ = null;
    }
  }

  /**
   * Go to the media details page.
   *
   * @param  resource -- the object of metadata
   * @return      void
   */
  goToDetails(resource: Media) {
    this.navController.push('media-details', { slug: resource.slug });
  }

  /**
   * Open the language popover
   *
   * @param   event The event that triggered it
   * @return void
   */
  openLanguagePopover(event) {
    this.popoverController.config.set('mode', 'ios');
    const popover = this.popoverController.create(LanguagePopoverComponent);
    popover.present({ ev: event });
  }

  /**
   * Load the page data
   *
   * @param   language  The language to load
   * @return void
   */
  private loadData(language: Language) {
    if ((this.currentLanguage) && (language.text === this.currentLanguage.text)) {
      return;
    }
    this.currentLanguage = language;
    this.mediaProvider.setLanguage(language.code);
    this.mediaProvider.recommended().pipe(
      mergeMap((recommended: Array<Media>) => {
        this.recommended = recommended;
        return this.mediaProvider.groupedByCategory(true);
      })
    ).pipe(
      take(1)
    ).subscribe((media: GroupedMedia) => {
      this.groups = media;
      if (this.groups.hasOwnProperty('other')) {
        this.others = this.groups['other'].media;
      } else {
        this.others = [];
      }
      this.groupKeys = Object.keys(media).filter((slug) => slug !== 'other');
    });
    if (!this.logo || this.logo.length < 5) { this.logo = "/imgs/logo.png"; }  // 20230823 Added to resolve issues related to language missing in content
    this.translateService.get('APP_LOGO').pipe(take(1)).subscribe((logo: string) => this.logo = logo);
  }

  goChat() {
    this.navController.push('ChatPage');
  }

}
