import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { from } from 'rxjs/observable/from';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators/map';
import { switchMap } from 'rxjs/operators/switchMap';
import { Language } from '@models/language';
import { environment } from '@env';
import { zip } from 'rxjs/observable/zip';

/**
 * A provider for setting and tracking available languages
 */
@Injectable()
export class LanguageProvider {

  /**
   * The supported languages
   */
  languages: Array<Language> = [];

  /**
   * When the language changes, this will notify users.
   */
  onLanguageChange: Observable<Language>;

  /**
   * The storage key that stores the file.
   */
  storageKey = 'language';

  /**
   * The current selected language
   */
  private currentLanguage: Language = null;

  /**
   * The subject for traking changes to the language
   */
  private languageSubject: Subject<Language>;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private translate: TranslateService,
  ) {
    this.languageSubject = new Subject();
    this.onLanguageChange = this.languageSubject.asObservable();
  }

  /**
   * Get the default supported language.
   *
   * @return The default language
   */
  getDefaultLanguage(): Observable<Language> {
    return this.supported().pipe(
      map((supported: Array<Language>) => supported.find((lang) => lang.isDefault))
    );
  }

  /**
   * Get the user's language. This will save the language once retrieved.
   * It first checks the database, and if it does not exist, it will call
   * getPreferredLanguage() and save the result.
   *
   * @return The user's language
   */
  getLanguage(): Observable<Language> {
    if (this.currentLanguage) {
      return of(this.currentLanguage);
    }
    return zip(
      this.storage.get(this.storageKey),
      this.supported()
    ).pipe(
      switchMap(([data, supported]) => {
        if (data) {
          // Is it in the supported list
          const parsed = JSON.parse(data);
          const found = supported.find((lang: Language) => lang.text.toLowerCase() === parsed.text.toLowerCase());
          if (found) {
            const lang = new Language(parsed.codes, parsed.text, parsed.isDefault, parsed.isRtl);
            this.languageSubject.next(lang);
            return of(lang);
          }
        }
// 20230719 Don't consult browser.  Use default if needed.
        return this.getDefaultLanguage();
//      return this.getPreferredLanguage().pipe(
//        switchMap((preferred: Language) => this.saveLanguage(preferred).pipe(map(() => preferred)))
//      );
      })
    );
  }

  /**
   * Get a user's preferred language based on the browser.
   *
   * @return The preferred language or the default language
   *
   * NOTE: Android & iOS provide different codes.  For example, Traditional Chinese,
   * The globalization plugin returns these codes:
   *
   * ios:
   *
   * zh-Hant-US - Chinese Traditional
   * zh-Hant-HK - Hong Kong Traditional
   * zh-Hant-MO - Macau Traditional
   * zh-Hant-TW - Tawain Traditional
   *
   * Android:
   *
   * zh-HK - Hong Kong Traditional
   * zh-MO - Macau Traditional
   * zh-TW - Tawain Traditional
   */
  getPreferredLanguage(): Observable<Language> {
    const preferred = this.translate.getBrowserCultureLang();
    if (preferred) {
      return this.supported().pipe(
        switchMap((supported: Array<Language>) => {
          const regional = supported.find((lang: Language) => lang.codes.indexOf(preferred.toLowerCase()) !== -1);
          if (regional) {
            return of(regional);
          }
          if (preferred.indexOf('-') !== -1) {
            const langParts = preferred.split('-');
            const specific = supported.find((lang: Language) => lang.codes.indexOf(langParts[0].toLowerCase()) !== -1);
            if (specific) {
              return of(specific);
            }
          }
          return this.getDefaultLanguage();
        })
      );
    }
    return this.getDefaultLanguage();
  }

  /**
   * Save the new language selected.
   *
   * @param  language The selected language
   * @return          Was it saved?
   */
  saveLanguage(language: Language): Observable<boolean> {
    return this.supported().pipe(
      switchMap((supported: Array<Language>) => {
        const found = supported.find((lang: Language) => lang.text.toLowerCase() === language.text.toLowerCase());
        if (!found) {
          console.log(`Unable to locate language settings: ${language.text.toLowerCase()}`);
          return of(false);
        }
        this.currentLanguage = found;
        this.languageSubject.next(found);
        return from(
          this.storage.set(this.storageKey, JSON.stringify(found))
        ).pipe(map(() => true));
      })
    );
  }

  /**
   * Get a list of all the supported languages
   *
   * @return The languages
   */
  supported(): Observable<Array<Language>> {
    return this.load();
  }

  /**
   * Load the supported languages.
   *
   * @return The supported languages
   */
  private load(): Observable<Array<Language>> {
    if (this.languages.length > 0) {
      return of(this.languages);
    }
    const path = environment.languagePath;
    return this.http.get(path).pipe(
      map((response: any) => {
        if (!response) {
          return [];
        }
        this.languages = response.map((lang: any) => {
          const isRtl = (lang.hasOwnProperty('rtl')) ? lang.rtl : false;
          return new Language(lang.codes, lang.text, lang.default, isRtl);
        });
        return this.languages;
      })
    );
  }
}
