var flickrApp = (function () {

    var lastSearch,
        fetching,
        curPage,
        shortestDiv;

    function newSearch(inputTag) {
        clearPanes();
        curPage = 1;
        lastSearch = inputTag;
        shortestDiv = $('.pane').first(),
        fetchResults(inputTag);
    }

    function updateSearch() {
        if (!fetching || !isEmpty(lastSearch)) {
            curPage++;
            fetchResults(lastSearch);
        }
    }

    function fetchResults(tag) {
        var imagesDict = [];
        fetching = true;

        $.getJSON("https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=f78494780f95e1bec66ca62a8ef4b272&format=json&nojsoncallback=1", {
            tags: tag,
            tagmode: 'any',
            per_page: 20,
            page: curPage
        },
            function (data) {
                $.each(data.photos.photo, function (i, item) {
                    imagesDict.push({
                        id: item.id,
                        secret: item.secret
                    });
                });
            }).done(function () {

                function nextItem(i) {

                    if (i < imagesDict.length) {
                        $.getJSON("https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=f78494780f95e1bec66ca62a8ef4b272&format=json&nojsoncallback=1", {
                            photo_id: imagesDict[i].id,
                            secret: imagesDict[i].secret
                        },
                            function (data) {
                                var currentTemplateDiv = buildTemplateDiv(data);
                                currentTemplateDiv.appendTo(getShortestDiv());

                                nextItem(i + 1);
                            });
                    } else {
                        //bottom of recursion - all responses are received
                        fetching = false;
                        renderFullSizedImages();
                    }
                }

                nextItem(0);
            });
    }

    function getShortestDiv() {
        $(".pane").each(function () {
            if ($(this).height() < shortestDiv.height()) {
                shortestDiv = $(this);
            }
        });

        return shortestDiv;
    }

    function getTags(arr) {
        var result = '';
        for (var i = 0; i < arr.length; i++) {
            result += arr[i]._content + ' ';
        }
        return result.trim();
    }

    function isEmpty(str) {
        return (!str || 0 === str.length);
    }

    function clearPanes() {
        $('.pane').each(function () {
            $(this).empty();
        });
    }

    function buildTemplateDiv(data) {
        var title = isEmpty(data.photo.title._content) ? 'Untitled' : data.photo.title._content;
        var author = data.photo.owner.username;
        var authorBrowseLink = data.photo.owner.nsid;
        var description = isEmpty(data.photo.description._content) ? 'No description available' : 'Description: ' + data.photo.description._content;
        var tags = 'Tags: ' + getTags(data.photo.tags.tag);

        //urlThumbnail is the URL of the full sized photo concatenated with '_t'
        var urlThumbnail = 'https://farm' + data.photo.farm + '.staticflickr.com/' + data.photo.server + '/' + data.photo.id + '_' + data.photo.secret + '_t.jpg';

        var div = $("<div class='imageWrapper'></div>");
        var img = $("<img width='240px' class='image' thumbnail src='" + urlThumbnail + "'></img>");
        var titleLink = $('<a href="https://www.flickr.com/photos/' + authorBrowseLink + '/' + data.photo.id + '">' + title + '</a>');
        var bySpan = $('<span> by </span>');
        var authorLink = $('<a href="https://www.flickr.com/photos/' + authorBrowseLink + '">' + author + '</a>');
        var descriptionSpan = $('<span class="descriptionSpan">' + description + '</span>');
        var tagsSpan = $('<span class="tagsSpan">' + tags + '</span>');

        img.appendTo(div);
        titleLink.appendTo(div);
        bySpan.appendTo(div);
        authorLink.appendTo(div);
        descriptionSpan.appendTo(div);
        tagsSpan.appendTo(div);

        return div;
    }

    function renderFullSizedImages() {
        $('img[thumbnail]').each(function () {
            $(this).removeAttr('thumbnail');
            var fullImage = $(this).clone().addClass('hiddenImage');
            fullImage.insertAfter($(this));
            //preload full sized images and change thumbnail to full sized photo when it's fully loaded
            fullImage.on('load', function () {
                $(this).prev().remove();
                $(this).removeClass('hiddenImage');
            }).attr('src', fullImage.attr('src').replace('_t.jpg', '.jpg'))
        });
    }

    return {
        newSearch: newSearch,
        updateSearch: updateSearch,
        getShortestDiv: getShortestDiv,
    }
})();

$(document).ready(function () {
    var timeout;
    //delay variable works around two consecutive window scroll events
    var delay = 150;

    $(window).scroll(function () {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            if ($(window).scrollTop() + $(window).height() > flickrApp.getShortestDiv().height() - 200) {

                var tagsInput = $('#searchInput').val();
                flickrApp.updateSearch(tagsInput);
            }
        }, delay);
    });

    $('#searchButton').click(function () {
        var tagsInput = $('#searchInput').val();
        flickrApp.newSearch(tagsInput);
    });

    $('#searchInput').keydown(function (e) {
        if (e.keyCode == 13) {
            $('#searchButton').click();
        }
    });
});