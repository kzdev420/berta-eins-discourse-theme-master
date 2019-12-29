# name: berta-topic-view-plugin
# about: Changes for standard topic view
# version: 0.0.1
# authors: Vadim Bondar

register_asset 'stylesheets/topics_common.scss'
register_asset 'stylesheets/topics_mobile.scss'

after_initialize do
  add_to_class :post, :excerpt_for_topic do
    Post.excerpt(cooked, 200, strip_links: true)
  end
  add_to_serializer(:listable_topic, :include_excerpt?) { true }
end