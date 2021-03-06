module.exports = {
    google: {
        clientId: '',
        apiKey: '',
        channel: '',
        librariesToLoad: ['places'],
        version: '3',
        componentRestrictions: {},
        fields: ['address_component', 'adr_address', 'formatted_address', 'geometry', 'icon', 'name', 'place_id', 'type', 'url', 'vicinity'],
        useSessionTokens: true
    },
    woosmap: {
        projectKey: '',
        componentRestrictions: {},
        addressComponentRestrictions: {},
        types: [],
        data: 'standard',
        language: '',
        localitiesLibUrl: 'https://sdk.woosmap.com/localities/localities.js',
        addressApiUrl: 'https://api.woosmap.com/address/'
    },
    autocomplete: {
        minChars: 2,
        maxItems: 5,
        autoFirst: false,
        sort: false,
        debounceTime: 100,
    },
    search: {
        minRatio: 75,
        breakpointRatio: 100,
        fallbackWoosmapAddress: false,
        fallbackWoosmap: true,
    },
    analytics: {
        tracking: false,
        analyticsKey: '',
        eventCategoryWoosmap: 'woosmap-localities',
        eventCategoryWoosmapAddress: 'woosmap-address',
        eventCategoryGoogle: 'google-places'
    },
};