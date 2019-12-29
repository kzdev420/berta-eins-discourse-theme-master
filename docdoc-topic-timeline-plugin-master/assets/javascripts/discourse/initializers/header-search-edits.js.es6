import { withPluginApi } from 'discourse/lib/plugin-api';
import { h } from "virtual-dom";
import { on } from 'ember-addons/ember-computed-decorators';

export default {
    name: 'header-search',
    initialize(container){

        withPluginApi('0.8.9', api => {

            const PANEL_BODY_MARGIN = 30;

            api.modifyClass('component:site-header', {

                @on('didInsertElement')
                initSizeWatcher() {
                    Ember.run.scheduleOnce('afterRender', () => {
                        this.$('.menu-panel.drop-down').append('<a href="#" class="close-search-pane">x</a>');
                    });
                },

                afterRender() {

                    let searchMenu = $('.search-menu');
                    if (searchMenu.length > 0) {
                        let customBlock = $('.custom-block');
                        let results = $('.results');
                        let noResults = $('.no-results');
                        if (customBlock.length == 0 ) {
                            $($('.panel-body')[0]).append('<div class="custom-block">' +
                                '<span>Nichts passendes gefunden?</span>' +
                                '<button id="create-topic" onclick="createTopic();" class="btn btn-default btn btn-icon-text ember-view">  <svg class="fa d-icon d-icon-plus svg-icon svg-string" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#plus"></use></svg>' +
                                '<span class="d-button-label">Neuer Beitrag</span>' +
                                '</button>' +
                                '</div>');
                        }
                    }

                    const $menuPanels = $(".menu-panel");
                    if ($menuPanels.length === 0) {
                        if (this.site.mobileView) {
                            this._animate = true;
                        }
                        return;
                    }

                    const $window = $(window);
                    const windowWidth = parseInt($window.width());

                    const headerWidth = $("#main-outlet .container").width() || 1100;
                    const remaining = parseInt((windowWidth - headerWidth) / 2);
                    const viewMode = remaining < 50 ? "drop-down" : "drop-down";

                    $menuPanels.each((idx, panel) => {
                        const $panel = $(panel);
                        const $headerCloak = $(".header-cloak");
                        let width = parseInt($panel.attr("data-max-width") || 300);
                        if (windowWidth - width < 50) {
                            width = windowWidth - 50;
                        }
                        if (this._panMenuOffset) {
                            this._panMenuOffset = -width;
                        }

                        $panel.removeClass("drop-down slide-in").addClass(viewMode);
                        if (this._animate || this._panMenuOffset !== 0) {
                            $headerCloak.css("opacity", 0);
                            if (
                                this.site.mobileView &&
                                $panel.parent(this._leftMenuClass()).length > 0
                            ) {
                                this._panMenuOrigin = "left";
                                $panel.css("left", -windowWidth);
                            } else {
                                this._panMenuOrigin = "right";
                                $panel.css("right", -windowWidth);
                            }
                        }

                        const $panelBody = $(".panel-body", $panel);
                        // 2 pixel fudge allows for firefox subpixel sizing stuff causing scrollbar
                        let contentHeight =
                            parseInt($(".panel-body-contents", $panel).height()) + 2;

                        // We use a mutationObserver to check for style changes, so it's important
                        // we don't set it if it doesn't change. Same goes for the $panelBody!
                        const style = $panel.prop("style");

                        if (viewMode === "drop-down") {
                            const $buttonPanel = $("header ul.icons");
                            if ($buttonPanel.length === 0) {
                                return;
                            }

                            // These values need to be set here, not in the css file - this is to deal with the
                            // possibility of the window being resized and the menu changing from .slide-in to .drop-down.
                            if (style.top !== "100%" || style.height !== "auto") {
                                $panel.css({ top: "100%", height: "auto" });
                            }

                            // adjust panel height
                            const fullHeight = parseInt($window.height());
                            const offsetTop = $panel.offset().top;
                            const scrollTop = $window.scrollTop();

                            if (
                                contentHeight + (offsetTop - scrollTop) + PANEL_BODY_MARGIN >
                                fullHeight ||
                                this.site.mobileView
                            ) {
                                contentHeight =
                                    fullHeight - (offsetTop - scrollTop) - PANEL_BODY_MARGIN;
                            }
                            if ($panelBody.height() !== contentHeight) {
                                $panelBody.height(contentHeight);
                            }
                            $("body").addClass("drop-down-mode");
                        } else {
                            if (this.site.mobileView) {
                                $headerCloak.show();
                            }

                            const menuTop = this.site.mobileView ? headerTop() : headerHeight();

                            let height;
                            const winHeightOffset = 16;
                            let initialWinHeight = window.innerHeight
                                ? window.innerHeight
                                : $(window).height();
                            const winHeight = initialWinHeight - winHeightOffset;
                            if (menuTop + contentHeight < winHeight && !this.site.mobileView) {
                                height = contentHeight + "px";
                            } else {
                                height = winHeight - menuTop;
                            }

                            if ($panelBody.prop("style").height !== "100%") {
                                $panelBody.height("100%");
                            }
                            if (style.top !== menuTop + "px" || style.height !== height) {
                                $panel.css({ top: menuTop + "px", height });
                                $(".header-cloak").css({ top: menuTop + "px" });
                            }
                            $("body").removeClass("drop-down-mode");
                        }

                        $panel.width(width);
                        if (this._animate) {
                            $panel.addClass("animate");
                            $headerCloak.addClass("animate");
                            this._scheduledRemoveAnimate = Ember.run.later(() => {
                                $panel.removeClass("animate");
                                $headerCloak.removeClass("animate");
                            }, 200);
                        }
                        $panel.css({ right: "", left: "" });
                        $headerCloak.css("opacity", 0.5);
                        this._animate = false;
                    });
                }

            });

            const forceContextEnabled = ["category", "user", "private_messages"];
            let additionalPanels = [];

            api.reopenWidget('header', {

                html(attrs, state) {
                    let contents = () => {
                        const panels = [
                            this.attach("header-buttons", attrs),
                            this.attach("header-icons", {
                                hamburgerVisible: state.hamburgerVisible,
                                userVisible: state.userVisible,
                                searchVisible: state.searchVisible,
                                ringBackdrop: state.ringBackdrop,
                                flagCount: attrs.flagCount,
                                user: this.currentUser
                            })
                        ];

                        if (state.searchVisible) {
                            const contextType = this.searchContextType();

                            if (state.searchContextType !== contextType) {
                                state.contextEnabled = undefined;
                                state.searchContextType = contextType;
                            }

                            if (state.contextEnabled === undefined) {
                                if (forceContextEnabled.includes(contextType)) {
                                    state.contextEnabled = true;
                                }
                            }

                            panels.push(
                                this.attach("search-menu", {contextEnabled: state.contextEnabled})
                            );
                        } else if (state.hamburgerVisible) {
                            panels.push(this.attach("hamburger-menu"));
                        } else if (state.userVisible) {
                            panels.push(this.attach("user-menu"));
                        }
                        if (this.site.mobileView) {
                            panels.push(this.attach("header-cloak"));
                        }

                        additionalPanels.map(panel => {
                            if (this.state[panel.toggle]) {
                                panels.push(
                                    this.attach(
                                        panel.name,
                                        panel.transformAttrs.call(this, attrs, state)
                                    )
                                );
                            }
                        });

                        return panels;
                    };
                    let contentsAttrs = { contents, minimized: !!attrs.topic };
                    return h(
                        "div.wrap",
                        this.attach("header-contents", $.extend({}, attrs, contentsAttrs))
                    );
                }

            });


            api.reopenWidget('search-menu', {
                html() {
                    this.attach("link", {
                        className: "close-search-panel",
                        title: "x",
                        label: "x"
                    });
                    let results = this.panelContents();
                    // results.push(h("a.close-search-panel", { attributes: {'href': '#', 'onclick': this.sendWidgetAction("toggleSearchMenu")} }, 'x'));
                    results.push(
                        this.attach("link", {
                            className: "close-search-panel",
                            title: "x",
                            label: "x"
                        })
                    );

                    if (this.state.formFactor === 'header') {
                        return results;
                    } else {
                        return this.attach('menu-panel', {
                            contents: () => results
                        });
                    }
                }

            });

        });

    }
};

function headerHeight() {
    const $header = $("header.d-header");
    const headerOffset = $header.offset();
    const headerOffsetTop = headerOffset ? headerOffset.top : 0;
    return parseInt(
        $header.outerHeight() + headerOffsetTop - $(window).scrollTop()
    );
}

function headerTop() {
    const $header = $("header.d-header");
    const headerOffset = $header.offset();
    const headerOffsetTop = headerOffset ? headerOffset.top : 0;
    return parseInt(headerOffsetTop - $(window).scrollTop());
}