export default function() {
  this.route('discovery', { path: '/', resetNamespace: true }, function() {
    this.route('lohnrechner', { path: '/lohnrechner' });
    Discourse.Site.currentProp('filters').forEach(filter => {
      this.route(filter + 'Lohnrechner', { path: '/lohnrechner/' + filter });
    });
  });
}
