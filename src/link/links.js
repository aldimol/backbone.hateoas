/**
 * Backbone model which represents a set of HAL Link.
 *
 * > A Link Object represents a hyperlink from the containing resource to a URI.
 *
 * @author Baptiste GAILLARD (baptiste.gaillard@gomoob.com)
 * @see https://tools.ietf.org/html/draft-kelly-json-hal-06#section-5
 */
Hal.Links = Backbone.Model.extend(
    {
        /**
         * Utility function used to get the `self` link.
         *
         * @return {Hal.Link} The self link.
         */
        getSelf : function() {

            return this.get('self');

        },

        /**
         * Function used to indicate if the `self` link is defined.
         *
         * @return {Boolean} True if the self link is defined, false otherwise.
         */
        hasSelf : function() {

            var self = this.getSelf();

            return !(_.isNull(self) || _.isUndefined(self));

        },

        /**
         * Set a hash of model attributes on the object, firing `"change"`. This is the core primitive operation of a
         * model, updating the data and notifying anyone who needs to know about the change in state. The heart of the
         * beast.
         *
         * @param {Object | String} A Javascript containing multiple key / value pairs to set or the name of a property
         *        to set.
         * @param {String | *} The value to associated to a key if the first parameter is a key, options otherwise.
         * @param {Object} options Options to be used when the first parameter is a key and the second one a value.
         *
         * @return {Hal.Model} This.
         */
        set: function(key, val, options) {

            var attrs;

            if (key === null) {

                return this;

            }

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (typeof key === 'object') {

                attrs = key;
                options = val;

            } else {

                (attrs = {})[key] = val;

            }

            _.map(
                attrs,
                function(link, rel) {

                    // If the provided element is already a Hal.Link we set it directly
                    if(link instanceof Hal.Link) {

                        Backbone.Model.prototype.set.call(this, rel, link, options);

                    }

                    // Otherwise if the provided element is an array
                    else if(_.isArray(link)) {

                        Backbone.Model.prototype.set.call(this, rel, new Hal.LinkArray(link), options);

                    }

                    // Otherwise if the provided element is an object
                    else if(_.isObject(link)) {

                        Backbone.Model.prototype.set.call(this, rel, new Hal.Link(link), options);

                    }

                    // Null or undefined are authorized
                    else if(_.isNull(link) || _.isUndefined(link)) {

                        Backbone.Model.prototype.set.call(this, rel, link, options);

                    }

                    // Otherwise this is an error
                    else {

                        Hal.ErrorHandler.capture(
                            'Invalid embedded identified by \'rel\'=\'' + rel + '\' !',
                            'Hal.Links.set',
                            {
                                key : key,
                                link : link,
                                options : options,
                                rel : rel,
                                val : val
                            }
                        );

                    }

                },
                this
            );

            return this;

        },

        /**
         * Function used to convert this `_links` into a Javascript object to be passed to `JSON.stringify(obj)`.
         *
         * @param {Object} options (Optional) Options used to configure the behavior of the method.
         * @param {String} options.contentType (Optional) A content type to be used to create the representation, currently
         *        the method accepts 'application/json' (the default one) or 'application/hal+json'.
         *
         * @return {Object} The resulting object which MUST BE compliant with HAL.
         */
        toJSON : function(options) {

            var json = {},
               _options = options || {},
               contentType = _options.contentType || Hal.contentType || 'application/json';

            for(var rel in this.attributes) {

                var resource = this.attributes[rel];

                // Null or undefined are authorized
                if(_.isNull(resource) || _.isUndefined(resource)) {

                    json[rel] = resource;

                }

                // Otherwise we expect a Hal.Model
                else {

                    json[rel] = resource.toJSON(_options);

                }

            }

            return json;

        }
    }
);
