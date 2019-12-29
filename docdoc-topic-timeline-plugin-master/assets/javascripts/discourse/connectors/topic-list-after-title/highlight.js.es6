import { ajax } from 'discourse/lib/ajax';


export default {

    setupComponent(args, component) {
        component.set('actions', {})
        component.set('actions.toggleFavorite', () => { console.log('my action triggered') })
    }
    // ,
    //
    // actions: {
    //     toggleFavorite: function () {
    //         console.log('11111');
    //     }
    // }

};
