import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators/catchError';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators/map';
import { environment } from '@env';

/**
 * This provider loads configurations in assets directory if it exists.
 * This provides a way to set specific configurations without building the code base.
 * We currently support the following keys:
 *
 * disable_openwell_chat/disable_chat: Disables the chat functionality.
 * disable_stats: Disable the collecting of stats.
 */
@Injectable()
export class LiveConfigurationProvider {

  /**
   * Have we finished loading the file?
   */
  private isInitialized = false;

  /**
   * Do we want to display the logo and app name in the header?
   */
  private displayTheBranding = true;

  /**
   * Do we allow chatting?
   */
  private chatEnabled = true;

  /**
   * Are we collecting stats?
   */
  private statsEnabled = true;

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Do we allow chatting?
   *
   * @return yes|no
   */
  get allowsChat(): boolean {
    return this.chatEnabled;
  }

  /**
   * Do we want to display the branding?
   * 
   * @return yes|no
   */
  get displayBranding(): boolean {
    return this.displayTheBranding;
  }

  /**
   * Do we collect stats?
   *
   * @return yes|no
   */
  get collectingStats(): boolean {
    return this.statsEnabled;
  }

  /**
   * load the configurations
   *
   * @return void
   */
  init(): Observable<void> {
    return this.load().pipe(map((response: any) =>  {
      console.log(response);
      if (response && response.hasOwnProperty('disable_openwell_chat')) {
        this.chatEnabled = (!response.disable_openwell_chat);
      }
      if (response && response.hasOwnProperty('disable_chat')) {
        this.chatEnabled = (!response.disable_chat);
      }
      if (response && response.hasOwnProperty('disable_stats')) {
        this.statsEnabled = (!response.disable_stats);
      }
      if (response && response.hasOwnProperty('hide_branding')) {
        this.displayTheBranding = (!response.hide_branding);
      }
      this.isInitialized = true;
      return null;
    }));
  }

  /**
   * Load the configuration file
   *
   * @return void
   */
  private load(): Observable<any> {
    if (environment.liveConfigFile === '') {
      return of(null);
    }
    if (this.isInitialized) {
      return of(null);
    }
    return this.http.get(environment.liveConfigFile).pipe(catchError(() =>  of(null)));
  }

}
