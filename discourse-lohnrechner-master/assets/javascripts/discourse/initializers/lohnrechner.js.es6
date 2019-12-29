import buildTopicRoute from 'discourse/routes/build-topic-route';
import DiscoverySortableController from "discourse/controllers/discovery-sortable"
import { default as computed } from 'ember-addons/ember-computed-decorators';

function buildLohnrechnerRoute(filter) {
  return buildTopicRoute('lohnrechner/' + filter, {
    beforeModel() {
      this.controllerFor('navigation/default').set('filterMode', filter);
    }
  });
}

export default {
  name: "lohnrechner-routes",

  initialize(container) {

    /**
     * This feature is available only to logged users.
     */
    const currentUser = container.lookup('current-user:main');
    if (!currentUser) {
      return;
    }

       /**
     * Create controllers for lohnrechner.
     */
    Discourse[`DiscoverylohnrechnerController`] = DiscoverySortableController.extend();
    Discourse[`DiscoverylohnrechnerRoute`] = buildLohnrechnerRoute('latest');

    Discourse.Site.current().get('filters').forEach(filter => {
      const filterCapitalized = filter.capitalize();
      Discourse[`Discovery${filterCapitalized}lohnrechnerController`] = DiscoverySortableController.extend();
      Discourse[`Discovery${filterCapitalized}lohnrechnerRoute`] = buildLohnrechnerRoute(filter);
    });

  }
};
