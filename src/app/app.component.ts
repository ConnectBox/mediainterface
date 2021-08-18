import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import { LanguageProvider } from '@providers/language/language';
import { Language } from '@models/language';

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnInit, OnDestroy {
  /**
   * The root page
   */
  rootPage: string = 'HomePage';

  /**
   * The current selected language
   */
  private currentLanguage: Language = null;

  /**
   * Our stream for tracking changes on the language
   */
  private languageOnChangeStream$: any = null;

  constructor(
    private languageProvider: LanguageProvider,
    private platform: Platform,
    private translate: TranslateService,
  ) {}

  /**
   * The class is intialized
   *
   * @return void
   */
  ngOnInit() {
    this.translate.setDefaultLang('en');
    this.languageProvider.getLanguage().pipe(take(1)).subscribe((language: Language) => {
      this.currentLanguage = language;
      this.translate.use(language.twoLetterCode);
      if (language.isRtl) {
        this.platform.setDir('rtl', true);
      } else {
        this.platform.setDir('ltr', true);
      }
    });
    this.languageOnChangeStream$ = this.languageProvider.onLanguageChange.subscribe((language: Language) => {
      if ((this.currentLanguage) && (language.text !== this.currentLanguage.text)) {
        this.currentLanguage = language;
        this.translate.use(language.twoLetterCode);
        console.log(language);
        if (language.isRtl) {
          this.platform.setDir('rtl', true);
        } else {
          this.platform.setDir('ltr', true);
        }
      }
    });
  }

  /**
   * The class will be destrroyed.
   *
   * @return void
   */
  ngOnDestroy() {
    if (this.languageOnChangeStream$) {
      this.languageOnChangeStream$.unsubscribe();
      this.languageOnChangeStream$ = null;
    }
  }

}
