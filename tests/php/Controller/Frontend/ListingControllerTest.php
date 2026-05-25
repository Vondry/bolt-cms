<?php

declare(strict_types=1);

namespace Bolt\Tests\Controller\Frontend;

use Bolt\Configuration\Config;
use Bolt\Tests\DbAwareTestCase;

class ListingControllerTest extends DbAwareTestCase
{
    protected function setUp(): void
    {
        // The test environment has no `canonical` configured, which makes the
        // CanonicalSubscriber choke on frontend requests. Provide a value so we
        // can exercise the full frontend request/response cycle.
        putenv('BOLT_CANONICAL=http://localhost');
        $_SERVER['BOLT_CANONICAL'] = 'http://localhost';
        $_ENV['BOLT_CANONICAL'] = 'http://localhost';

        parent::setUp();
    }

    protected function tearDown(): void
    {
        putenv('BOLT_CANONICAL');
        unset($_SERVER['BOLT_CANONICAL'], $_ENV['BOLT_CANONICAL']);

        parent::tearDown();
    }

    /**
     * When a listing is reached via a matched route but with a locale that the
     * ContentType doesn't support, it redirects to the default locale.
     * (The `if ($redirect instanceof Response) { return $redirect; }` branch.)
     */
    public function testListingRedirectsToDefaultLocaleWhenLocaleNotSupported(): void
    {
        // `pages` is localized to en/nl/ja/nb, so `fr` is a valid app-locale but
        // not valid for this ContentType.
        $this->client->request('GET', '/fr/pages');
        $response = $this->client->getResponse();

        self::assertSame(302, $response->getStatusCode());
        self::assertStringContainsString('/en/pages', (string) $response->headers->get('Location'));
    }

    /**
     * When a listing is reached *without* a matched route (a forwarded request,
     * e.g. the homepage rendered as a listing) and the locale isn't supported,
     * there's no route to redirect to — so it must fall back to rendering in the
     * default locale instead of erroring. (The fallback after the redirect branch.)
     */
    public function testListingFallsBackToDefaultLocaleWhenForwardedWithoutRoute(): void
    {
        // Configure the homepage as a (non-singleton) listing, so HomepageController
        // forwards the request to ListingController without a `_route`.
        $this->setHomepage('pages');

        $this->client->request('GET', '/fr/');
        $response = $this->client->getResponse();

        // No redirect, no error: the listing is rendered in the default locale.
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('<html lang="en"', (string) $response->getContent());
    }

    private function setHomepage(string $homepage): void
    {
        $config = self::getContainer()->get(Config::class);

        // Mutate only the `general` collection in place; rebuilding the whole data
        // tree would turn `contenttypes` into plain collections and break typing.
        $property = new \ReflectionProperty(Config::class, 'data');
        $property->getValue($config)->get('general')->put('homepage', $homepage);
    }
}
