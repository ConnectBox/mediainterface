import {} from 'jasmine';
import { Language } from './language';

describe('Language', () => {

  describe('constructor', () => {

    it('should lowercase all codes on initialization', () => {
      const lang = new Language(
        ['zh', 'zh-HANT', 'zh-HK', 'zh-TO', 'zh-MO'],
        '今日未得之民',
        false,
      );
      expect(lang.codes).not.toEqual(['zh', 'zh-HANT', 'zh-HK', 'zh-TO', 'zh-MO']);
      expect(lang.codes).toEqual(['zh', 'zh-hant', 'zh-hk', 'zh-to', 'zh-mo']);
    });

    it('should set the code to the two letter code', () => {
      const lang = new Language(
        ['zh', 'zh-HANT', 'zh-HK', 'zh-TO', 'zh-MO'],
        '今日未得之民',
        false,
      );
      expect(lang.code).toEqual('zh');
    });

    it('should set the code by splitting a code', () => {
      const lang = new Language(
        ['zh-HANT', 'zh-HK', 'zh-TO', 'zh-MO'],
        '今日未得之民',
        false,
      );
      expect(lang.code).toEqual('zh');
    });

    it('should set the code to the three letter code', () => {
      const lang = new Language(
        ['zza'],
        'Dimili',
        false,
      );
      expect(lang.code).toEqual('zzb');
    });

  });

});
