import { Link } from "react-router";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-[#050505] border border-neutral-900 rounded-2xl p-8 text-neutral-200">
        <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>

        <p className="text-xs text-neutral-500 mb-8">
          Last Updated: September 2, 2026
        </p>

        <div className="space-y-6 text-sm leading-6 text-justify">
          <section>
            <h3 className="text-lg font-semibold mb-2">Welcome to Chess42</h3>
            <p>
              Welcome to Chess42. These Terms of Service ("Terms") govern your
              access to and use of the Chess42 website, applications, games,
              services, and related features (collectively, the "Service").
            </p>
            <p className="mt-3">
              By creating an account, accessing, or using Chess42, you agree to
              be bound by these Terms. If you do not agree with these Terms,
              you must not use the Service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">1. Eligibility</h3>
            <p>
              You must be legally capable of entering into a binding agreement
              to use Chess42.
            </p>
            <p className="mt-3">
              If you are under the age required to enter into contracts in your
              country, you may use Chess42 only with the involvement and
              consent of a parent or legal guardian where required by
              applicable law.
            </p>
            <p className="mt-3">
              By using the Service, you represent that the information you
              provide is accurate and that you meet the applicable eligibility
              requirements.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. Your Chess42 Account</h3>
            <p>
              Certain features of Chess42 may require you to create an account.
            </p>

            <p className="mt-3">You are responsible for:</p>

            <ul className="list-disc pl-6 space-y-1">
              <li>providing accurate and current information;</li>
              <li>maintaining the confidentiality of your account credentials;</li>
              <li>keeping your account secure;</li>
              <li>all activity that occurs through your account; and</li>
              <li>
                notifying Chess42 promptly if you believe your account has been
                compromised.
              </li>
            </ul>

            <p className="mt-3">
              You must not create an account using another person's identity or
              information, impersonate another person, or create accounts for
              fraudulent or abusive purposes.
            </p>

            <p className="mt-3">
              Chess42 reserves the right to suspend or terminate accounts that
              violate these Terms or applicable law.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">3. Acceptable Use</h3>
            <p>
              You agree to use Chess42 responsibly and in accordance with these
              Terms and applicable law.
            </p>

            <p className="mt-3">You must not:</p>

            <ul className="list-disc pl-6 space-y-1">
              <li>use the Service for unlawful, fraudulent, or abusive purposes;</li>
              <li>harass, threaten, or intimidate other users;</li>
              <li>engage in hate speech or targeted abusive behavior;</li>
              <li>distribute malicious software or harmful code;</li>
              <li>
                attempt to gain unauthorized access to Chess42 or another user's
                account;
              </li>
              <li>interfere with the operation or security of the Service;</li>
              <li>
                scrape, copy, reproduce, or systematically collect data from
                the Service without authorization;
              </li>
              <li>
                use bots, scripts, or automated systems in a way that is not
                expressly authorized;
              </li>
              <li>manipulate ratings, rankings, games, tournaments, or other competitive systems;</li>
              <li>exploit bugs, vulnerabilities, or unintended features;</li>
              <li>sell, transfer, or otherwise misuse Chess42 accounts; or</li>
              <li>
                use the Service in any manner that could harm Chess42, its
                users, or third parties.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              4. Fair Play and Cheating
            </h3>
            <p>
              Chess42 is committed to providing a fair and competitive
              environment.
            </p>

            <p className="mt-3">
              When participating in games, tournaments, rankings, or other
              competitive features, you must not use chess engines, assistance
              tools, unauthorized software, external assistance, or other
              methods intended to provide an unfair advantage where such
              assistance is prohibited by the applicable game or competition
              rules.
            </p>

            <p className="mt-3">
              Chess42 may use automated systems, statistical analysis, manual
              review, or other methods to detect suspicious or prohibited
              behavior.
            </p>

            <p className="mt-3">
              If Chess42 reasonably determines that a user has violated
              fair-play rules, it may take appropriate action, including:
            </p>

            <ul className="list-disc pl-6 space-y-1">
              <li>cancelling or adjusting game results;</li>
              <li>removing ratings or rankings;</li>
              <li>restricting access to competitive features;</li>
              <li>suspending an account; or</li>
              <li>permanently terminating an account.</li>
            </ul>

            <p className="mt-3">
              Chess42 may not disclose all details of its detection systems
              where doing so could undermine the integrity of its fair-play
              mechanisms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              5. Games, Tournaments, and Rankings
            </h3>
            <p>
              Chess42 may provide online chess games, tournaments, leaderboards,
              ratings, rankings, challenges, and other competitive features.
            </p>

            <p className="mt-3">
              Rankings and ratings are provided for informational and
              entertainment purposes unless otherwise stated.
            </p>

            <p className="mt-3">
              Chess42 reserves the right to modify, correct, reset, or remove
              ratings, rankings, tournament results, or other competitive data
              when reasonably necessary to address cheating, abuse, technical
              errors, fraud, or other violations.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">6. User Content</h3>
            <p>
              Users may be able to submit or publish content through Chess42,
              including usernames, profile information, messages, comments,
              game-related content, images, and other materials ("User
              Content").
            </p>

            <p className="mt-3">
              You retain ownership of User Content that you lawfully own.
            </p>

            <p className="mt-3">
              By submitting User Content to Chess42, you grant Chess42 a
              worldwide, non-exclusive, royalty-free license to host, store,
              reproduce, display, distribute, and otherwise use that content as
              reasonably necessary to operate, maintain, improve, and promote
              the Service.
            </p>

            <p className="mt-3">
              You represent that you have the necessary rights to submit the
              User Content and that your content does not violate these Terms,
              applicable law, or the rights of others.
            </p>

            <p className="mt-3">
              Chess42 may remove or restrict User Content that it reasonably
              believes violates these Terms, applicable law, or the safety of
              the Service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              7. Intellectual Property
            </h3>
            <p>
              The Service and its contents, including software, design,
              graphics, logos, trademarks, interfaces, text, features, and
              other materials provided by Chess42, are owned by or licensed to
              Chess42 and are protected by applicable intellectual property
              laws.
            </p>

            <p className="mt-3">
              Except as expressly permitted by Chess42 or applicable law, you
              may not:
            </p>

            <ul className="list-disc pl-6 space-y-1">
              <li>copy or reproduce the Service;</li>
              <li>modify or create derivative works from the Service;</li>
              <li>distribute or publicly display Chess42 materials;</li>
              <li>reverse engineer or attempt to extract source code from the Service;</li>
              <li>use Chess42 trademarks or branding without permission; or</li>
              <li>commercially exploit any part of the Service without authorization.</li>
            </ul>

            <p className="mt-3">
              Nothing in these Terms transfers ownership of Chess42
              intellectual property to you.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              8. Payments and Subscriptions
            </h3>
            <p>
              Chess42 may offer paid subscriptions, premium features, virtual
              items, tournament entries, or other paid services.
            </p>

            <p className="mt-3">
              Where applicable, prices, billing periods, renewal terms, and
              cancellation conditions will be presented before purchase.
            </p>

            <p className="mt-3">
              Unless otherwise required by applicable law, subscriptions may
              automatically renew for the applicable renewal period until
              cancelled.
            </p>

            <p className="mt-3">
              You authorize Chess42 or its payment provider to charge the
              applicable fees using your selected payment method.
            </p>

            <p className="mt-3">
              You are responsible for any applicable taxes, except taxes that
              Chess42 is legally required to collect and pay on your behalf.
            </p>

            <p className="mt-3">
              Refunds are handled in accordance with applicable law and any
              additional refund policy presented at the time of purchase.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              9. Third-Party Services
            </h3>
            <p>
              Chess42 may integrate with or provide access to third-party
              services, platforms, payment providers, authentication providers,
              or other external services.
            </p>

            <p className="mt-3">
              Third-party services may be subject to their own terms and
              privacy policies. Chess42 is not responsible for third-party
              services that it does not control.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">10. Privacy</h3>
            <p>
              Your use of Chess42 is also subject to our Privacy Policy, which
              explains how we collect, use, store, and otherwise process
              personal information.
            </p>

            <p className="mt-3">
              By using the Service, you acknowledge that you have had the
              opportunity to review the Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              11. Service Availability
            </h3>
            <p>
              Chess42 aims to provide a reliable Service but does not guarantee
              that the Service will always be available, uninterrupted, secure,
              or error-free.
            </p>

            <p className="mt-3">
              The Service may occasionally be unavailable due to maintenance,
              updates, technical issues, security incidents, third-party
              services, or circumstances outside Chess42's reasonable control.
            </p>

            <p className="mt-3">
              Chess42 may modify, suspend, or discontinue any feature or part
              of the Service at any time, subject to applicable law.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              12. Disclaimer of Warranties
            </h3>
            <p>
              To the maximum extent permitted by applicable law, the Service is
              provided on an "as is" and "as available" basis.
            </p>

            <p className="mt-3">Chess42 does not guarantee that:</p>

            <ul className="list-disc pl-6 space-y-1">
              <li>the Service will meet every user's requirements;</li>
              <li>the Service will be uninterrupted or error-free;</li>
              <li>
                games, ratings, rankings, or other data will always be accurate
                or available; or
              </li>
              <li>
                the Service will be free from security vulnerabilities or
                harmful components.
              </li>
            </ul>

            <p className="mt-3">
              Nothing in these Terms excludes or limits any warranty or
              consumer right that cannot legally be excluded or limited.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              13. Limitation of Liability
            </h3>
            <p>
              To the maximum extent permitted by applicable law, Chess42 and
              its affiliates, officers, employees, contractors, and service
              providers will not be liable for indirect, incidental, special,
              consequential, or punitive damages arising from or related to
              your use of, or inability to use, the Service.
            </p>

            <p className="mt-3">
              Where liability cannot legally be excluded, Chess42's liability
              will be limited to the maximum extent permitted by applicable
              law.
            </p>

            <p className="mt-3">
              Nothing in these Terms limits liability where such limitation is
              prohibited by applicable law.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">14. Indemnification</h3>
            <p>
              To the extent permitted by applicable law, you agree to indemnify
              and hold harmless Chess42 and its affiliates, officers, employees,
              contractors, and service providers from claims, damages,
              liabilities, losses, and expenses arising from:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>your violation of these Terms;</li>
              <li>your unlawful use of the Service;</li>
              <li>your User Content; or</li>
              <li>
                your violation of the rights of another person or entity.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              15. Suspension and Termination
            </h3>
            <p>You may stop using Chess42 at any time.</p>

            <p className="mt-3">
              Chess42 may suspend or terminate your access to the Service if it
              reasonably believes that you have:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>violated these Terms;</li>
              <li>engaged in cheating, fraud, abuse, or other prohibited activity;</li>
              <li>created a security or legal risk;</li>
              <li>misused the Service; or</li>
              <li>violated applicable law.</li>
            </ul>

            <p className="mt-3">
              Where appropriate and legally required, Chess42 may provide
              notice and an opportunity to remedy the violation.
            </p>

            <p className="mt-3">
              Termination does not affect provisions that by their nature
              should survive termination, including provisions concerning
              intellectual property, disclaimers, limitations of liability, and
              dispute-related provisions.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              16. Changes to These Terms
            </h3>
            <p>
              Chess42 may update these Terms from time to time.
            </p>

            <p className="mt-3">
              If material changes are made, Chess42 may provide notice through
              the Service, by email, or by other appropriate means.
            </p>

            <p className="mt-3">
              Your continued use of Chess42 after the updated Terms become
              effective constitutes acceptance of the revised Terms, to the
              extent permitted by applicable law.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              17. Governing Law and Disputes
            </h3>
            <p>
              These Terms are governed by the laws applicable to Chess42 and its
              users, without regard to conflict-of-law principles, except where
              mandatory consumer protection laws provide otherwise.
            </p>

            <p className="mt-3">
              If you have a dispute with Chess42, you agree to first attempt to
              resolve the matter by contacting Chess42 and providing a
              reasonable opportunity to address the issue.
            </p>

            <p className="mt-3">
              Nothing in these Terms limits any mandatory rights you may have
              under the consumer protection laws of your country of residence.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">18. Severability</h3>
            <p>
              If any provision of these Terms is found to be invalid, unlawful,
              or unenforceable, that provision will be enforced to the maximum
              extent permitted by law, and the remaining provisions will remain
              in full force and effect.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              19. Entire Agreement
            </h3>
            <p>
              These Terms, together with any policies or additional terms
              expressly incorporated into them, constitute the agreement between
              you and Chess42 concerning your use of the Service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">20. Contact</h3>
            <p>
              If you have questions about these Terms or the Service, please
              contact Chess42 through the official support or contact channels
              provided on the Chess42 website or application.
            </p>
          </section>

          <div className="pt-4 border-t border-neutral-900">
            <p className="text-neutral-400">
              By using Chess42, you acknowledge that you have read, understood,
              and agree to these Terms of Service.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            to="/login"
            className="text-blue-500 hover:underline text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
