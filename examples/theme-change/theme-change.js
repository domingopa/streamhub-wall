require([
    'livefyre-auth',
    'auth/contrib/auth-button',
    'livefyre-auth/livefyre-auth-delegate',
    'streamhub-sdk/debug',
    'streamhub-sdk/jquery',
    'streamhub-sdk/collection',
    'streamhub-sdk/content',
    'streamhub-sdk/auth',
    'streamhub-wall'
],function (auth, createAuthButton, livefyreAuthDelegate, debug,
$, Collection, Content, Auth, LiveMediaWall) {
    window.auth = auth;
    var log = debug('streamhub-sdk/auth-demo');
    var authButton = createAuthButton(auth, document.getElementById('auth-button'));

    var delegate = window.delegate = livefyreAuthDelegate('http://www.livefyre.com');
    auth.delegate(delegate);

    var opts = {
        "network": "livefyre.com",
        "siteId": "313878",
        "articleId": "1",
        "environment": "livefyre.com"
    };
    window.Collection = Collection;
    var collection = new Collection(opts);

    var wall = window.view = new LiveMediaWall({
        el: document.getElementById("listView"),
        collection: opts,
        postButton: true,
        sharer: function (content) {
            console.log('share', content);
        }
    });


    $('.head button').on('click', function(ev) {
        var config = {};
        var name = ev.target.name;

        switch (name) {
            case 'red':
            case 'black':
            case 'yellow':
                config.linkColor = name;
                break;
            case 'lightTheme':
                config = { linkAttachmentTextColor: '#666666'
                  , linkAttachmentBackgroundColor: '#f2f2f2'
                  , linkAttachmentBorderColor: 'rgba(0,0,0,0.3)'
                  , buttonTextColor: '#ffffff'
                  , cardBackgroundColor: '#fff'
                  , textColor: '#4c4c4c'
                  , footerTextColor: '#b2b2b2'
                  };
                break;
            case 'darkTheme':
                config = { linkAttachmentTextColor: '#999999'
                  , linkAttachmentBackgroundColor: '#403d47'
                  , linkAttachmentBorderColor: 'rgba(0,0,0,0.5)'
                  , buttonTextColor: '#ffffff'
                  , cardBackgroundColor: '#343139'
                  , textColor: 'rgba(255, 255, 255, 0.7)'
                  , footerTextColor: 'rgba(255, 255, 255, 0.3)'
                  , sourceLogoColor: 'rgba(255, 255, 255, 0.3)'
                  };
                break;







            default:
        }

        wall.configure(config);
    });
});
