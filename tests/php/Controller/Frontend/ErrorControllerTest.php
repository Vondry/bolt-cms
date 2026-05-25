<?php

declare(strict_types=1);

namespace Bolt\Tests\Controller\Frontend;

use Bolt\Configuration\Config;
use Bolt\Controller\ErrorController;
use Bolt\Entity\Content;
use Bolt\Enum\Statuses;
use Bolt\Tests\DbAwareTestCase;
use Bolt\Widget\Injector\RequestZone;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Contracts\Translation\TranslatorInterface;
use Throwable;
use Twig\Environment;

class ErrorControllerTest extends DbAwareTestCase
{
    private const HEADING_EN = 'Not-found-heading-in-English';
    private const HEADING_NL = 'Niet-gevonden-kop-in-het-Nederlands';

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

    public function testNotFoundRecordRendersLocalizedFieldInRequestedLocale(): void
    {
        $this->seedLocalizedNotFoundPage();

        $this->client->request('GET', '/nl/this-page-does-not-exist');
        $response = $this->client->getResponse();
        $body = (string) $response->getContent();

        self::assertSame(404, $response->getStatusCode());
        // `htmllang()` (rendered as `<html lang="...">`) reflects the current locale.
        self::assertStringContainsString('<html lang="nl"', $body);
        // The localized `heading` field is rendered in Dutch, not English.
        self::assertStringContainsString(self::HEADING_NL, $body);
        self::assertStringNotContainsString(self::HEADING_EN, $body);
    }

    public function testNotFoundRecordRendersLocalizedFieldInDefaultLocale(): void
    {
        $this->seedLocalizedNotFoundPage();

        $this->client->request('GET', '/this-page-does-not-exist');
        $response = $this->client->getResponse();
        $body = (string) $response->getContent();

        self::assertSame(404, $response->getStatusCode());
        self::assertStringContainsString('<html lang="en"', $body);
        self::assertStringContainsString(self::HEADING_EN, $body);
        self::assertStringNotContainsString(self::HEADING_NL, $body);
    }

    public function testForbiddenRecordRendersLocalizedFieldInRequestedLocale(): void
    {
        $page = $this->seedLocalizedPage();
        $this->setGeneralConfig('forbidden', ['page/' . $page->getId()]);

        // A frontend 403 doesn't arise from a routed request in the test app (all
        // `access_control` rules are backend, and the backend 403 path redirects to
        // the dashboard rather than rendering the custom page). So we drive the
        // configured `error_controller` directly, exactly as Symfony's error
        // handling does, with the URL whose locale should be recovered. A 403
        // `AccessDeniedHttpException` routes to `showForbidden()`, which renders the
        // configured `general/forbidden` page (set above to our localized record).
        //
        // Note: `showAction()` returns the rendered page as a plain 200; promoting
        // the status to the exception's 403 is the kernel's job (see
        // HttpKernel::handleThrowable()), which we bypass here. So we assert the
        // locale handling that *is* this controller's responsibility, not the code.
        $response = $this->renderError(new AccessDeniedHttpException(), '/nl/this-page-is-forbidden');
        $body = (string) $response->getContent();

        // `htmllang()` (rendered as `<html lang="...">`) reflects the current locale.
        self::assertStringContainsString('<html lang="nl"', $body);
        // The localized `heading` field is rendered in Dutch, not English. (Its mere
        // presence also proves the *forbidden* page rendered: only `general/forbidden`
        // points at this record - the default `notfound` renders a different block.)
        self::assertStringContainsString(self::HEADING_NL, $body);
        self::assertStringNotContainsString(self::HEADING_EN, $body);
    }

    public function testErrorPageRecoversTranslatorLocaleFromPath(): void
    {
        // When no route matches, Symfony's LocaleListener/LocaleAwareListener never
        // run, so the translator keeps its default locale and `{% trans %}` strings
        // in the error page render in the wrong language. The error controller must
        // recover the locale from the path onto the (shared) translator too.
        $page = $this->seedLocalizedPage();
        $this->setGeneralConfig('notfound', ['page/' . $page->getId()]);

        $this->renderError(new NotFoundHttpException(), '/nl/this-page-does-not-exist');

        /** @var TranslatorInterface $translator */
        $translator = self::getContainer()->get('translator');
        self::assertSame('nl', $translator->getLocale());
    }

    public function testNotFoundPageWithNonLocalizedContentTypeDoesNotError(): void
    {
        // The default `notfound` points at `blocks/404-not-found`. The `blocks`
        // ContentType is *not* localized, so the requested `nl` locale can't be
        // honored for the record. This must not error (regression: it used to
        // attempt an invalid redirect, throwing a TypeError); instead it renders
        // the not-found record.
        $this->client->request('GET', '/nl/this-page-does-not-exist');
        $response = $this->client->getResponse();

        self::assertSame(404, $response->getStatusCode());
        self::assertStringContainsString('404 Page not found', (string) $response->getContent());
    }

    /**
     * Point the 404 page at a published, localized `pages` record with distinct
     * `heading` values per locale.
     */
    private function seedLocalizedNotFoundPage(): void
    {
        $page = $this->seedLocalizedPage();

        $this->setGeneralConfig('notfound', ['page/' . $page->getId()]);
    }

    /**
     * Give a published `pages` record distinct `heading` values per locale.
     */
    private function seedLocalizedPage(): Content
    {
        $page = $this->getPublishedPage();

        $page->setFieldValue('heading', self::HEADING_EN, 'en');
        $page->setFieldValue('heading', self::HEADING_NL, 'nl');
        $page->getField('heading')->mergeNewTranslations();
        $this->getEm()->flush();

        return $page;
    }

    /**
     * Invoke the configured `error_controller` directly, the way Symfony's error
     * handling does, with a frontend request for the given path on the stack so
     * the locale can be recovered from it.
     */
    private function renderError(Throwable $exception, string $path): Response
    {
        $request = Request::create('http://localhost' . $path);
        RequestZone::setToRequest($request, RequestZone::FRONTEND);

        /** @var RequestStack $requestStack */
        $requestStack = self::getContainer()->get(RequestStack::class);
        $requestStack->push($request);

        /** @var ErrorController $errorController */
        $errorController = self::getContainer()->get(ErrorController::class);
        /** @var Environment $twig */
        $twig = self::getContainer()->get('twig');

        return $errorController->showAction($twig, $exception);
    }

    private function getPublishedPage(): Content
    {
        $page = $this->getEm()->getRepository(Content::class)
            ->findOneBy(['contentType' => 'pages', 'status' => Statuses::PUBLISHED]);

        self::assertInstanceOf(Content::class, $page, 'Expected a published "pages" record in the fixtures.');

        return $page;
    }

    /**
     * Override a `general/*` configuration value at runtime.
     *
     * @param array<string> $value
     */
    private function setGeneralConfig(string $key, array $value): void
    {
        $config = self::getContainer()->get(Config::class);

        // Mutate only the `general` collection in place; rebuilding the whole data
        // tree would turn `contenttypes` into plain collections and break typing.
        $property = new \ReflectionProperty(Config::class, 'data');
        $property->getValue($config)->get('general')->put($key, $value);
    }
}
