import { Component, ElementRef, ViewChild } from '@angular/core';
import { Events, IonicPage, NavController, NavParams, Platform, PopoverController, ViewController } from 'ionic-angular';
import { Book, Rendition } from 'epubjs';
import { take } from 'rxjs/operators/take';
import { DownloadFileProvider } from '@providers/download-file/download-file';
import { EpubViewerItem } from './epub-viewer-item.interface';
import { NavParamsDataStoreProvider } from '@providers/nav-params-data-store/nav-params-data-store';
import { TocItem } from '@components/toc-popover/toc-item.interface';
import { TocPopoverComponent } from '@components/toc-popover/toc-popover';

/**
 * ePubjs is included in index.html
 */
// declare var ePub: any;

/**
 * An epub viewer.
 */
@IonicPage({
  name: 'epub-viewer',
  segment: 'details/:slug/epub-viewer',
})
@Component({
  selector: 'page-epub-viewer',
  templateUrl: 'epub-viewer.html',
})
export class EpubViewerPage {

  /**
   * The book we are viewing
   */
  book: any = null;

  /**
   * The current font size in percentage
   */
  fontSize: number = 100;

  /**
   * The rendition of the book
   */
  rendition: any = null;

  /**
   * The current page we are viewing
   */
  currentPage: number = 1;

  /**
   * A reference to the download link
   */
  @ViewChild('downloadLink') downloadLinkRef: ElementRef;

  /**
   * Do we want to show the toolbars?
   */
  showToolbars: boolean = true;

  /**
   * The item to view
   */
  private item: EpubViewerItem = null;

  /**
   * The title for the current section
   */
  sectionTitle: string = '';

  /**
   * The slug for the previous page
   */
  slug = '';

  /**
   * Our storage key
   */
  private storageKey = 'epub-viewer';

  /**
   * The table of contents
   */
  private toc: Array<TocItem> = [];

  /**
   * Listen to changes in the TOC component
   */
  private tocStream$: any = null;

  constructor(
    private dataStore: NavParamsDataStoreProvider,
    private downloadFileProvider: DownloadFileProvider,
    private events: Events,
    private navController: NavController,
    private navParams: NavParams,
    private platform: Platform,
    private popoverController: PopoverController,
    private viewController: ViewController,
  ) {
  }

  /**
   * Ionic view lifecycle
   *
   * @return void
   */
  ionViewDidLoad() {
    this.item = this.navParams.get('item');
    this.slug = this.navParams.get('slug');
    if (typeof this.item === 'undefined') {
        // They refreshed the page. Get the data from the store.
        this.dataStore.get(this.storageKey).pipe(take(1)).subscribe((data: string) => {
          if (data === '') {
            this.goBack();
          }
          this.item = JSON.parse(data);
          this.loadFile();
        });
    } else {
      this.dataStore.store(this.storageKey, JSON.stringify(this.item)).pipe(take(1)).subscribe(() => this.loadFile());
    }
    this.tocStream$ = this.events.subscribe('toc-popover:change-page', (selected: TocItem) => this.rendition.display(selected.ref));
  }

  /**
   * Ionic LifeCycle the view will leave
   *
   * @return void
   */
  ionViewWillLeave() {
    if (this.rendition) {
      this.rendition.destroy();
      this.rendition = null;
    }
    if (this.tocStream$) {
      this.tocStream$.unsubscribe();
      this.tocStream$ = null;
    }
  }

  /**
   * Change the page on swipe
   *
   * @param  event The event that triggered it
   * @return       void
   */
  changePage(event) {
    if ((this.platform.isRTL) && (event.velocityX > 0)) {
      this.next();
    } else if ((this.platform.isRTL) && (event.velocityX < 0)) {
      this.prev();
    } else if(event.velocityX < 0) {
      this.next();
    } else {
      this.prev();
    }
  }


  /**
   * Decrease the font size
   *
   * @return void
   */
  decreaseFont() {
      if (this.fontSize <= 20) {
          return;
      }
      this.fontSize -= 10;
      this.rendition.themes.fontSize(`${this.fontSize}%`);
  }

  /**
   * Download the file.
   *
   * @return void
   * @link https://www.illucit.com/en/angular/angular-5-httpclient-file-download-with-authentication/
   */
  downloadFile() {
    const fileName = this.item.url.split('\\').pop().split('/').pop();
    this.downloadFileProvider.download(this.item.url).pipe(take(1)).subscribe((blob: any) => {
      const url = window.URL.createObjectURL(blob);
      const link = this.downloadLinkRef.nativeElement;
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  /**
   * Go back to the previous page
   *
   * @return void
   */
  goBack() {
    this.dataStore.remove(this.storageKey);
    if (this.navController.canGoBack()) {
      this.navController.pop();
    } else if (this.slug !== '') {
      this.navController.push(
        'media-details',
        { slug: this.slug },
        {
          animate: true,
          direction: 'back',
        },
      ).then(() => {
        // Remove us from backstack
        this.navController.remove(this.viewController.index);
        this.navController.insert(0, 'HomePage');
      });
    } else {
      this.navController.goToRoot({
        animate: true,
      });
    }
  }

  /**
   * Increase the font size
   *
   * @return void
   */
  increaseFont() {
    this.fontSize += 10;
    this.rendition.themes.fontSize(`${this.fontSize}%`);
  }

  /**
   * A convience method for flatten our toc array
   *
   * @param  arr The array to flatten
   * @return     The new array
   */
  flatten(arr: Array<any>) {
    return [].concat(...arr.map(v => [v, ...this.flatten(v.subitems)]));
  }
  /**
   * Load the file
   *
   * @return void
   */
  loadFile() {
    this.book = new Book(this.item.url);
    this.rendition = this.book.renderTo('book', { width: '100%', height: '100%' });
    this.rendition.themes.fontSize(`${this.fontSize}%`);
    this.rendition.display();
    this.rendition.on('rendered', (location) => {
      const titles = this.toc.filter((item: TocItem) => this.book.canonical(item.ref) == this.book.canonical(location.href));
      this.sectionTitle = (titles.length === 1) ? titles[0].label : '';
    });
    /**
     * Set up toc
     */
    this.book.loaded.navigation.then((toc) => {
      this.toc = this.flatten(toc.toc).map((section: any) => {
        const item: TocItem = {
          id: String(section.id),
          label:String(section.label).replace(/(\r\n|\n|\r)/gm, '').trim(),
          ref: String(section.href),
        };
        return item;
      });
    });
  }

  /**
   * Go to the next page.
   *
   * @return void
   */
  next() {
    this.currentPage += 1;
    this.rendition.next();
  }

  /**
   * Open the table of contents.
   *
   * @return void
   */
  openTocPopover() {
    this.popoverController.config.set('mode', 'ios');
    const popover = this.popoverController.create(TocPopoverComponent, { toc: this.toc });
    popover.present({ ev: event });
  }

  /**
   * Go to the previous page.
   *
   * @return void
   */
  prev() {
    if (this.currentPage === 1) {
        return;
    }
    this.currentPage -= 1;
    this.rendition.prev();
  }

  /**
   * Toggle the toolbars.
   *
   * @return void
   */
  toggleToolbars()
  {
    this.showToolbars = !this.showToolbars;
  }

}