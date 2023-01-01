/**
 * A model of a language
 */
export class Language {
  /**
   * A two letter code representing the language
   */
  code = '';

  /**
   * Is this language selected?
   */
  isSelected = false;

  /**
   * Build the model
   *
   * @param codes           An array of codes for this specific language
   * @param text            The text for this language
   * @param isDefault=false Is this the default language
   * @param isRtl=false     Is the language right to left?
   *
   */
  constructor(
    public codes: Array<string>,
    public text: string,
    public isDefault = false,
    public isRtl = false,
  ) {
    this.codes = codes.map((code) => code.toLowerCase());
    //const specific = codes.find((code) => code.length === 2);   // Commented out 20221221 in favor of code below that supports 3 letter codes
    const specific = codes.find((code) => !code.includes('-'));
    const dashed = codes.find((code) => code.indexOf('-') !== -1);
    if (specific) {
      this.code = specific;
    } else if (dashed) {
      this.code = dashed.split('-')[0];
    }
    console.log(`Model indicates that language is ${this.code}`);
  }

}
