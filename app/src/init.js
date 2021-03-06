(() => {
    const GooglePlaces = require('./googleplaces');
    const Autocomplete = require('./autocomplete.js');
    const WoosmapLocalities = require('./woosmaplocalities.js');
    const WoosmapAddress = require('./woosmapaddress.js');
    const Analytics = require('./analytics.js');
    const _ = require('./utils.js');
    const defaultSearchConfig = require('./defaultconfig.js').search;

    class AutocompleteWoosmapSearchBox {
        constructor(input, options) {
            const self = this;
            this.input = input;

            options = options || {};
            const googleOptions = options.google || {};
            const searchOptions = options.search || {};
            const woosmapOptions = options.woosmap || {};
            const autocompleteOptions = options.autocomplete || {};
            const analyticsOptions = options.analytics || {};

            defaultSearchConfig.inputEvt = this.autocompleteWoosmapInputEvt;
            defaultSearchConfig.selectComplete = this.autocompleteSelectComplete;
            _.configure(this, defaultSearchConfig, searchOptions);

            this.google = new GooglePlaces(input, googleOptions);
            this.woosmap = new WoosmapLocalities(input, woosmapOptions);
            this.woosmapaddress = new WoosmapAddress(input, woosmapOptions);
            this.autocomplete = new Autocomplete(input, autocompleteOptions);
            this.analytics = new Analytics(input, analyticsOptions);

            this.currentSearch = '';

            _.$(this.input).addEventListener("click", () => {
                self.autocompleteClickEvt();
            });
            _.$(this.input).addEventListener("input", _.debounce(() => {
                self.inputEvt();
            }, this.autocomplete.debounceTime, false));
            _.$(this.input).addEventListener('autocomplete-selectcomplete', evt => {
                self.selectComplete(evt);
            });
        }

        autocompleteSelectComplete({text}) {
            switch (text.metadata.dataType) {
                case 'woosmap':
                    Autocomplete.$.fire(this.input, "autocomplete-woosmap-selectcomplete", {
                        woosmapLocality: text.metadata
                    });
                    if (this.analytics.tracking) {
                        this.analytics.trackSearch(this.analytics.eventCategoryWoosmap, text.metadata.public_id, text.metadata.searchedTerm, text.metadata.label, [text.metadata.type]);
                    }
                    break;
                case 'woosmapaddress':
                    this.woosmapaddress.getAddressDetails(text.label,
                        addressDetails =>
                            Autocomplete.$.fire(this.input, "autocomplete-woosmapaddress-selectcomplete",
                                {addressDetails}));
                    if (this.analytics.tracking) {
                        this.analytics.trackSearch(this.analytics.eventCategoryWoosmapAddress, text.index, text.metadata.searchedTerm, text.metadata.label, text.metadata.type);
                    }
                    break;
                case 'google':
                    this.google.getDetails(text.metadata.place_id,
                        placeDetails =>
                            Autocomplete.$.fire(this.input, "autocomplete-google-selectcomplete",
                                {placeDetails}));
                    if (this.analytics.tracking) {
                        this.analytics.trackSearch(this.analytics.eventCategoryGoogle, text.metadata.place_id, text.metadata.searchedTerm, text.metadata.label, text.metadata.types);
                    }
                    break;
                default:
                    break;
            }
        }

        autocompleteWoosmapInputEvt() {
            const listLocalitiesItems = [];
            let fullRatioLocalities = false;
            if (this.input.value.length >= this.autocomplete.minChars) {
                this.currentSearch = this.input.value;
                this.request = {
                    input: this.input.value
                };
                const self = this;
                this.woosmap.getQueryPredictions(this.input.value, (list, query) => {
                    fullRatioLocalities = false;
                    if (query !== self.autocomplete.input.value) {
                        return;
                    }
                    if (list.length > 0) {
                        self.autocomplete.filter = ({metadata}) => metadata.ratio >= self.minRatio;
                        if (self.autocomplete.sort !== false) {
                            self.autocomplete.sort = (a, b) => b.metadata.ratio - a.metadata.ratio;
                        }
                        self.autocomplete.item = suggestion => {
                            let matched_substrings = self.autocomplete.input.value;
                            if (suggestion.metadata.matched_substrings && suggestion.metadata.matched_substrings.description) {
                                matched_substrings = suggestion.metadata.matched_substrings.description;
                            }
                            const secondary_text = suggestion.metadata.admin_0;
                            const item_id = suggestion.metadata.index;
                            return Autocomplete.ITEM(suggestion, matched_substrings, item_id, secondary_text);
                        };
                        for (let i = 0, x = list.length; i < x; i++) {
                            if (list[i].metadata.ratio >= self.breakpointRatio) {
                                fullRatioLocalities = true;
                            }
                            listLocalitiesItems.push(list[i]);
                        }
                        if (fullRatioLocalities) {
                            self.autocomplete.container.classList.remove("google");
                            self.autocomplete.container.classList.remove("woosmapaddress");
                        }
                    }
                    if (!fullRatioLocalities && self.breakpointRatio > 0) {
                        const that = self;
                        if (self.fallbackWoosmapAddress) {
                            self.woosmapaddress.getQueryPredictions(self.request.input, (listWoosmapAddressItems, queryInput) => {
                                if (queryInput !== that.autocomplete.input.value) {
                                    return;
                                }
                                that.autocomplete.filter = () => true;
                                if (listWoosmapAddressItems.length > 0) {
                                    that.autocomplete.item = suggestion => {
                                        const matched_substrings = suggestion.metadata.matched_substring.description;
                                        const item_id = suggestion.metadata.index;
                                        const secondary_Text = suggestion.label.split(",").pop();
                                        return Autocomplete.ITEM(suggestion, matched_substrings, item_id, secondary_Text);
                                    };
                                    that.autocomplete.list = listWoosmapAddressItems;
                                    if (!self.autocomplete.container.classList.contains("woosmapaddress")) {
                                        self.autocomplete.container.classList.add("woosmapaddress");
                                    }
                                } else {
                                    while (that.autocomplete.ul.firstChild) {
                                        that.autocomplete.ul.removeChild(that.autocomplete.ul.firstChild);
                                    }
                                    if (that.fallbackWoosmap) {
                                        self.autocomplete.container.classList.remove("woosmapaddress");
                                        that.autocomplete.list = listLocalitiesItems;
                                    }
                                }
                            });
                        } else {
                            self.google.getPredictions(self.request, (listGooglePlacesItems, queryInput) => {
                                if (queryInput !== that.autocomplete.input.value) {
                                    return;
                                }
                                that.autocomplete.filter = () => true;
                                if (listGooglePlacesItems.length > 0) {
                                    that.autocomplete.item = suggestion => {
                                        const matched_substrings = suggestion.metadata.matched_substrings;
                                        const secondary_text = suggestion.metadata.structured_formatting.secondary_text;
                                        const item_id = suggestion.metadata.index;
                                        return Autocomplete.ITEM(suggestion, matched_substrings, item_id, secondary_text);
                                    };
                                    that.autocomplete.list = listGooglePlacesItems;
                                    if (!self.autocomplete.container.classList.contains("google")) {
                                        self.autocomplete.container.classList.add("google");
                                    }
                                } else {
                                    while (that.autocomplete.ul.firstChild) {
                                        that.autocomplete.ul.removeChild(that.autocomplete.ul.firstChild);
                                    }
                                    if (that.fallbackWoosmap) {
                                        self.autocomplete.container.classList.remove("google");
                                        that.autocomplete.list = listLocalitiesItems;
                                    }
                                }
                            });
                        }
                    } else {
                        self.autocomplete.list = listLocalitiesItems;
                    }

                });

            } else {
                this.autocomplete.list = [];
            }
        }

        autocompleteClickEvt() {
            if (this.autocomplete.ul.childNodes.length !== 0 && this.autocomplete.ul.hasAttribute('hidden')) {
                if (this.currentSearch !== this.input.value) {
                    this.inputEvt();
                } else {
                    this.autocomplete.open();
                }
            } else {
                this.autocomplete.close();
            }
        }
    }

    function start() {
        _.$$("input.autocomplete-woosmap").forEach(input => {
            new AutocompleteWoosmapSearchBox(input);
        });
    }

    if (typeof Document !== "undefined") {
        if (document.readyState !== "loading") {
            start();
        } else {
            document.addEventListener("DOMContentLoaded", start);
        }
    }

    if (typeof self !== "undefined") {
        self.AutocompleteWoosmapSearchBox = AutocompleteWoosmapSearchBox;
    }

    if (typeof module === "object" && module.exports) {
        module.exports = AutocompleteWoosmapSearchBox;
    }

    return AutocompleteWoosmapSearchBox;
})();
