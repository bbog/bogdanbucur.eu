window.onload = function () {

	const LANG = {
		'read_more': 'Read more'
	};

	const navbarToggle = document.getElementById('navbar-toggle');
	const navbarLinks = document.getElementById('navbar-links');

	const closeNavbar = function () {
		navbarToggle.setAttribute('aria-expanded', 'false');
		navbarLinks.classList.remove('is-open');
	};

	const openNavbar = function () {
		navbarToggle.setAttribute('aria-expanded', 'true');
		navbarLinks.classList.add('is-open');
	};

	navbarToggle.addEventListener('click', function () {
		const isOpen = navbarToggle.getAttribute('aria-expanded') === 'true';
		if (isOpen) {
			closeNavbar();
		} else {
			openNavbar();
		}
	});

	document.addEventListener('click', function (event) {
		if (!navbarLinks.classList.contains('is-open')) {
			return;
		}
		if (navbarToggle.contains(event.target) || navbarLinks.contains(event.target)) {
			return;
		}
		closeNavbar();
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape' && navbarLinks.classList.contains('is-open')) {
			closeNavbar();
			navbarToggle.focus();
		}
	});

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
					${LANG.read_more}
				</a>`;

			blog_posts_wrapper.appendChild(post_li);
		});
    };

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
    };

    loadBlogPosts({
    	url: 'https://programming.bogdanbucur.eu',
		key: '__GHOST_PROGRAMMING_KEY__',
		posts_wrapper_id: 'programming_blog_posts'
    });

    loadBlogPosts({
    	url: 'https://blog.bogdanbucur.eu',
		key: '__GHOST_PERSONAL_KEY__',
		posts_wrapper_id: 'personal_blog_posts'
    });
};