window.onload = function () {

	const writeBlogPostsToWrapper = function (posts, blog_posts_wrapper) {

    	posts.forEach(function (post) {

			let post_li = document.createElement('li');

			post_li.innerHTML = `
				<a href="${post.url}" title="${post.title}" class="post-image">
					<img src="${post.feature_image}" alt="${post.title}">
				</a>
				<a href="${post.url}" title="${post.title}" class="post-title">${post.title}</a>
				<p class="post-excerpt">${post.excerpt}</p>
				<a href="${post.url}" title="${post.title}" class="post-link">
					Citește mai mult
				</a>`;

			blog_posts_wrapper.appendChild(post_li);
		});
    }

    const loadBlogPosts = function (options) {
    	const blog_api = new GhostContentAPI({
	        url: options.url,
			key: options.key,
			version: "v6.0"
	    });

	    blog_api.posts.browse({limit: 3})
	    	.then(function (posts) {

	    		let blog_posts_wrapper = document.getElementById(options.posts_wrapper_id);
	    		writeBlogPostsToWrapper(posts, blog_posts_wrapper);
	    	});
    }

    loadBlogPosts({
    	url: 'https://programming.bogdanbucur.eu',
		key: '6187d16bf483ea08f515e2a155',
		posts_wrapper_id: 'programming_blog_posts'
    });

    loadBlogPosts({
    	url: 'https://blog.bogdanbucur.eu',
		key: '392e92f619bacf597c5cdd2e80',
		posts_wrapper_id: 'personal_blog_posts'
    });
};