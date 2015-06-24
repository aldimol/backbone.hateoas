/**
 * Backbone model which represents a set of embedded resources.
 *
 * @author Baptiste GAILLARD (baptiste.gaillard@gomoob.com)
 * @see https://tools.ietf.org/html/draft-kelly-json-hal-06#section-4.1.2
 */
Hal.Embedded = Backbone.Model.extend(
    {
        /**
         * Function used to initialize the links.
         *
         * @param {Object} options Options used to initialize the links.
         * @param {Object} embedded An object which maps HAL relation types to model classes the `_embedded` contains,
         *        the purpose of this property is the same as the Backbone.Collection `model` property except it defines
         *        a model class for each embedded resource.
         */
//        initialize : function(attributes, options) {

            // FIXME: Doit être fait dans la méthode set(key, val, options) de la même manière que pour Hal.Model !!!
//            _.map(
//                attributes,
//                function(embeddedResource, rel) {
//
//                    var halResource = null;
//
//                    // If 'embedded' is provided then we try to find a specified model or collection class
//                    if(this.embedded) {
//
//                        // The embedded resource is created using a function
//                        if(_.isFunction(this.embedded[rel])) {
//
//                            halResource = this.embedded[rel](rel, embeddedResource, options);
//
//                        }
//
//                        // The embedded resource is created using an Hal Collection
//                        else if(this.embedded[rel] instanceof Hal.Collection) {
//
//                            halResource = new Hal.Collection(embeddedResource);
//
//                        }
//
//                        // The embedded resource is created using an Hal Model
//                        else if(this.embedded[rel] instanceof Hal.Model) {
//
//                            halResource = new Hal.Model(embeddedResource);
//
//                        }
//
//                        // Otherwise this is an error
//                        else {
//
//                            throw new Error(
//                                'Invalid embedded model or collection class provided for \'rel\'=\'' + rel + '\' !'
//                            );
//
//                        }
//
//                    }
//
//                    // Otherwise if the '_embedded' resource is an array we consider it to be an Hal Collection
//                    else if(_.isArray(embeddedResource)) {
//
//                        halResource = [];
//
//                        _.each(embeddedResource, function(el) {
//
//                            halResource.push(new Hal.Model(el));
//
//                        });
//
//                    }
//
//                    // Otherwise of the '_embedded' resourec is an object we consider it to be an Hal Model
//                    else if(_.isObject(embeddedResource)) {
//
//                        halResource = new Hal.Model(embeddedResource);
//
//                    }
//
//                    // Otherwise this is an error
//                    else {
//
//                        throw new Error('Invalid embedded resource identified by \'rel\'=\'' + rel + '\' !');
//
//                    }
//
//                    this.set(rel, halResource);
//
//                },
//                this
//            );

//        },

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
                function(embeddedResource, rel) {

                    // If the provided element is already a Hal.Model or a Hal.Collection we set it directly
                    if(embeddedResource instanceof Hal.Model || embeddedResource instanceof Hal.Collection) {

                        Backbone.Model.prototype.set.call(this, rel, embeddedResource, options);

                    }

                    // The current embedded resource is an array
                    else if(_.isArray(embeddedResource)) {

                        var array = [];

                        // For each embedded resource
                        for(var i = 0; i < embeddedResource.length; ++i) {

                            // If the array element is already an Hal.Model or Hal.Collection object we set it directly
                            if(embeddedResource[i] instanceof Hal.Model || embeddedResource[i] instanceof Hal.Collection) {

                                array.push(embeddedResource[i]);

                            }

                            // Otherwise we create an Hal.Model instance by default
                            else {

                                array.push(new Hal.Model(embeddedResource[i]));

                            }

                        }

                        Backbone.Model.prototype.set.call(this, rel, array, options);

                    }

                    // The current embedded resource is a plain HAL object
                    else if(_.isObject(embeddedResource)){

                        Backbone.Model.prototype.set.call(this, rel, new Hal.Model(embeddedResource), options);

                    }

                    // Null or undefined are authorized
                    else if(_.isNull(embeddedResource) || _.isUndefined(embeddedResource)) {

                        Backbone.Model.prototype.set.call(this, rel, embeddedResource, options);

                    }

                    // Otherwise this is an error
                    else {

                        throw new Error('Invalid embedded resource identified by \'rel\'=\'' + rel + '\' !');

                    }

                },
                this
            );

            return this;

        },

        /**
         * Function used to convert this `_embedded` into a Javascript object to be passed to `JSON.stringify(obj)`.
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
                
                // Null or undefined are authorized, in most case it is encountered when the 'unset(attr)' method is
                // called
                if(_.isUndefined(resource) || _.isNull(resource)) {
                
                    json[rel] = resource;
                        
                } 
                
                // If the embedded resource is an array then we convert each object
                // FIXME: Ici il faut pouvoir serialiser les collections Backbone également ?
                else if(_.isArray(resource)) {

                    json[rel] = [];

                    for(var i = 0; i < resource.length; ++i) {

                        // A embedded resource can be undefined or null, in that case we convert it in a null json value  
                        if(_.isUndefined(resource[i]) || _.isNull(resource[i])) {
                        
                            json[rel].push(resource[i]);
                                
                        } 

                        // Otherwise we expect a Hal.Model
                        else {
                            
                            json[rel].push(resource[i].toJSON(_options));
                            
                        }

                    }

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
