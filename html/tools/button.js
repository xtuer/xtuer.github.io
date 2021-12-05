/**
 * 创建链接的按钮
 *
 * @param {Array} links 链接的数组: [{name: xxx, url: xxx}]
 */
function createButtons(links) {
    var classes = ['blue', 'green', 'red', 'purple', 'orange', 'yellow']; // 按钮样式
    var $links = $('#links').empty();

    for (var i = 0; i < links.length; i++) {
        // <a class="btn blue" href="#">Fox</a>
        if (links[i].url) {
            $('<a class="btn" target="_self">')
                .attr('href', links[i].url)
                .text(links[i].name)
                .addClass(classes[i % classes.length])
                .appendTo($links);
        } else if (links[i].links) {
            $('<a class="btn" target="_self">')
                .attr('data-links', JSON.stringify(links[i].links))
                .attr('href', '#')
                .text(links[i].name)
                .addClass(classes[i % classes.length])
                .appendTo($links);
        }
    }
}

(function() {
    // 1. 普通链接，页面跳转
    // 2. 有子链接，显示子链接
    $('#links').on('click', '.btn', function(e) {
        var subLinks = JSON.parse($(this).attr('data-links'));

        if (subLinks) {
            e.preventDefault();
            createButtons(subLinks);
            $('#back-button').show();
        }
    });

    // 点击后退按钮显示所有的按钮，隐藏后退按钮
    $('#back-button').click(() => {
        createButtons(window.links);
        $('#back-button').hide();
    });
})();
