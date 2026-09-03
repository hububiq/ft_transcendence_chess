import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-[#050505] border border-neutral-900 rounded-2xl p-8 text-neutral-200">
        {/* Back Button */}
        <div className="mb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-500 hover:underline text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>

        <p className="text-xs text-neutral-500 mb-8">
          Last updated: September 2, 2026
        </p>

        <div className="space-y-6 text-sm leading-6 text-justify">
          <section>
            <h3 className="text-lg font-semibold mb-2">1. Introduction</h3>

            <p>Welcome to Chess42 ("Chess42", "we", "us", or "our").</p>

            <p className="mt-3">
              Chess42 is an online chess platform that allows users to play
              chess against other players, participate in tournaments,
              communicate with other users, add players as friends, and view
              information about their games and opponents.
            </p>

            <p className="mt-3">
              This Privacy Policy explains how we collect, use, store, and share
              personal information when you use the Chess42 platform, website,
              mobile application, and related services (collectively, the
              "Service").
            </p>

            <p className="mt-3">
              By using Chess42, you acknowledge that you have read and
              understood this Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              2. Information We Collect
            </h3>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              2.1 Account Information
            </h4>

            <p>When you create a Chess42 account, we may collect:</p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Username or display name</li>
              <li>Email address</li>
              <li>Password or authentication credentials</li>
              <li>Profile picture, if provided</li>
              <li>Country or region, if provided</li>
              <li>Date of birth or age information, where required</li>
              <li>Account creation date</li>
              <li>Other information you voluntarily provide in your profile</li>
            </ul>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              2.2 Chess and Game Information
            </h4>

            <p>
              When you play chess on Chess42, we may collect and store
              information related to your games, including:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Games you have played</li>
              <li>Chess moves and game positions</li>
              <li>Game results</li>
              <li>Opponent information</li>
              <li>Game date and time</li>
              <li>Time controls</li>
              <li>Ratings and rankings</li>
              <li>Tournament participation and results</li>
              <li>Statistics related to your gameplay</li>
              <li>Game history</li>
            </ul>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              2.3 Social and Communication Information
            </h4>

            <p>
              Chess42 allows users to interact with each other. Depending on the
              features you use, we may collect:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Your friends and friend requests</li>
              <li>Users you follow or interact with</li>
              <li>Chat messages</li>
              <li>Messages sent to other users</li>
              <li>Reports or complaints submitted by you</li>
              <li>
                Information relating to moderation or abuse investigations
              </li>
            </ul>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              2.4 Information Visible to Other Users
            </h4>

            <p>
              Chess42 is a social gaming platform. Certain information
              associated with your account may therefore be visible to other
              users.
            </p>

            <p className="mt-3">
              Depending on your settings and the features available, this may
              include:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Your username</li>
              <li>Profile picture</li>
              <li>Chess rating</li>
              <li>Ranking</li>
              <li>Game statistics</li>
              <li>Public game history</li>
              <li>Tournament participation</li>
              <li>Tournament results</li>
              <li>Current or recent opponents</li>
              <li>Friends</li>
              <li>Other information you choose to make public</li>
            </ul>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              2.5 Technical and Usage Information
            </h4>

            <p>
              When you access Chess42, we may automatically collect certain
              technical information, such as:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>IP address</li>
              <li>Device type</li>
              <li>Operating system</li>
              <li>Browser type</li>
              <li>App version</li>
              <li>Language and regional settings</li>
              <li>Approximate location derived from IP address</li>
              <li>Log-in dates and times</li>
              <li>Pages and features accessed</li>
              <li>Interaction with the Service</li>
              <li>Error logs and diagnostic information</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              3. How We Use Your Information
            </h3>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Providing the Chess42 Service
            </h4>

            <p>We use your information to:</p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Create and manage your account</li>
              <li>Authenticate users</li>
              <li>Allow you to play chess with other users</li>
              <li>Match you with opponents</li>
              <li>Organize and operate tournaments</li>
              <li>Maintain ratings and rankings</li>
              <li>Display game history and results</li>
              <li>Allow you to add and communicate with friends</li>
              <li>Provide chat and messaging functionality</li>
              <li>Provide customer support</li>
            </ul>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Improving Chess42
            </h4>

            <p>
              We may use information about how users interact with Chess42 to:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Improve existing features</li>
              <li>Develop new features</li>
              <li>Understand how users use the platform</li>
              <li>Analyze performance and reliability</li>
              <li>Detect technical problems</li>
              <li>Improve the user experience</li>
            </ul>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Safety and Security
            </h4>

            <p>We may process information to:</p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Detect and prevent fraud</li>
              <li>Detect cheating or suspicious gameplay</li>
              <li>Prevent abuse and harassment</li>
              <li>Protect accounts and the platform</li>
              <li>Investigate violations of our Terms of Service</li>
              <li>Enforce community rules</li>
              <li>Respond to security incidents</li>
            </ul>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Legal Compliance
            </h4>

            <p>We may process personal information where necessary to:</p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Comply with applicable laws</li>
              <li>Respond to valid legal requests</li>
              <li>Establish, exercise, or defend legal claims</li>
              <li>
                Protect the rights and safety of Chess42, our users, or others
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              4. Legal Bases for Processing
            </h3>

            <p>
              If you are located in the European Economic Area (EEA), the United
              Kingdom, or another jurisdiction where similar legal requirements
              apply, we process personal information on one or more of the
              following legal bases.
            </p>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Performance of a Contract
            </h4>

            <p>
              We process information when it is necessary to provide the Chess42
              Service you have requested, such as creating your account,
              allowing you to play games, participating in tournaments, or
              communicating with other users.
            </p>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Legitimate Interests
            </h4>

            <p>
              We may process information where it is necessary for our
              legitimate interests, such as:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Securing the platform</li>
              <li>Preventing fraud and cheating</li>
              <li>Moderating content</li>
              <li>Improving Chess42</li>
              <li>Understanding platform usage</li>
              <li>Protecting our users and services</li>
            </ul>

            <p className="mt-3">
              Where we rely on legitimate interests, we consider and balance
              those interests against your rights and freedoms.
            </p>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Consent
            </h4>

            <p>
              Where required by law, we may ask for your consent before
              processing certain information, such as for certain types of
              cookies, analytics, or marketing communications.
            </p>

            <p className="mt-3">
              You may withdraw consent at any time where processing is based on
              consent.
            </p>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Legal Obligations
            </h4>

            <p>
              We may process information where necessary to comply with a legal
              obligation.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              5. Chat and User Communications
            </h3>

            <p>
              Chess42 provides chat and communication features that allow users
              to communicate with one another.
            </p>

            <p className="mt-3">
              Please remember that information you voluntarily share with
              another Chess42 user may be copied, saved, or shared by that user.
            </p>

            <p className="mt-3">
              We may process chat messages and related metadata for purposes
              including:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Delivering messages</li>
              <li>Providing the chat functionality</li>
              <li>
                Detecting spam, harassment, threats, or other prohibited content
              </li>
              <li>Investigating reports</li>
              <li>Enforcing our Terms of Service and Community Guidelines</li>
              <li>Protecting users and the platform</li>
            </ul>

            <p className="mt-3">
              We do not guarantee that communications through Chess42 are
              completely private.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              6. Public and Social Information
            </h3>

            <p>
              Some Chess42 features are designed to make player information
              visible to other users.
            </p>

            <p className="mt-3">
              For example, when you play a game, other users may be able to see
              information such as your username, rating, game result, and game
              history.
            </p>

            <p className="mt-3">
              Tournament standings and results may also be publicly visible.
            </p>

            <p className="mt-3">
              You should therefore avoid including sensitive personal
              information in your username, profile, game comments, or chat
              messages.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              7. Cookies and Similar Technologies
            </h3>

            <p>
              Chess42 may use cookies, local storage, SDKs, and similar
              technologies to:
            </p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Maintain security</li>
              <li>Understand how the Service is used</li>
              <li>Measure performance</li>
              <li>Improve the Service</li>
            </ul>

            <p className="mt-3">
              Where required by applicable law, we will request your consent
              before placing non-essential cookies or similar technologies.
            </p>

            <p className="mt-3">
              You can control certain cookies through your browser or device
              settings.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              8. Sharing of Personal Information
            </h3>

            <p>We do not sell your personal information for money.</p>

            <p className="mt-3">
              We may share personal information with selected third parties when
              necessary to operate Chess42.
            </p>

            <p className="mt-3">These third parties may include:</p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Cloud hosting providers</li>
              <li>Database and infrastructure providers</li>
              <li>Authentication providers</li>
              <li>Analytics providers</li>
              <li>Email and notification providers</li>
              <li>Customer support providers</li>
              <li>Security and fraud-prevention providers</li>
              <li>Payment providers, where applicable</li>
              <li>Professional advisers, such as lawyers or accountants</li>
            </ul>

            <h4 className="font-semibold text-neutral-300 mt-4 mb-2">
              Legal and Safety Disclosures
            </h4>

            <p>We may disclose information when reasonably necessary to:</p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Comply with applicable law</li>
              <li>Respond to lawful requests from authorities</li>
              <li>Protect the safety of users</li>
              <li>Investigate fraud or abuse</li>
              <li>Enforce our Terms of Service</li>
              <li>Protect our rights, property, or security</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              9. International Data Transfers
            </h3>

            <p>
              Chess42 and our service providers may process personal information
              in countries other than the country where you live.
            </p>

            <p className="mt-3">
              If personal information is transferred outside the EEA, UK, or
              another jurisdiction that restricts international data transfers,
              we will use appropriate safeguards where required by applicable
              law.
            </p>

            <p className="mt-3">
              These safeguards may include contractual protections or other
              legally recognized transfer mechanisms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">10. Data Retention</h3>

            <p>
              We retain personal information for as long as reasonably necessary
              to provide the Chess42 Service and for legitimate business and
              legal purposes.
            </p>

            <p className="mt-3">
              Different types of information may be retained for different
              periods.
            </p>

            <p className="mt-3">For example:</p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                Account information may be retained while your account remains
                active.
              </li>
              <li>
                Game records may be retained for the operation of game history,
                ratings, rankings, and tournaments.
              </li>
              <li>
                Tournament results may be retained as part of the historical
                record of Chess42 competitions.
              </li>
              <li>
                Chat information may be retained as necessary for the operation,
                security, and moderation of the platform.
              </li>
              <li>
                Certain information may be retained after account deletion where
                necessary to comply with legal obligations, resolve disputes,
                prevent fraud, or enforce our agreements.
              </li>
            </ul>

            <p className="mt-3">
              When information is no longer required, we will delete it or
              anonymize it where reasonably practicable.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">11. Account Deletion</h3>

            <p>You may request deletion of your Chess42 account.</p>

            <p className="mt-3">
              Depending on the circumstances and applicable law, deleting your
              account may result in the deletion or anonymization of certain
              personal information.
            </p>

            <p className="mt-3">
              Some information may remain available after account deletion where
              it is necessary for legitimate purposes or where applicable law
              permits or requires us to retain it.
            </p>

            <p className="mt-3">
              For example, historical tournament results or anonymized game
              records may be retained to preserve the integrity of Chess42
              rankings and competition history.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              12. Your Privacy Rights
            </h3>

            <p>
              Depending on where you live, you may have certain rights regarding
              your personal information.
            </p>

            <p className="mt-3">These may include the right to:</p>

            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Request restriction of certain processing</li>
              <li>Object to certain processing</li>
              <li>Request portability of certain information</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>
                Lodge a complaint with a relevant data protection authority
              </li>
            </ul>

            <p className="mt-3">
              To exercise your rights, contact us using the contact information
              provided below.
            </p>

            <p className="mt-3">
              We may need to verify your identity before fulfilling certain
              requests.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              13. Children's Privacy
            </h3>

            <p>
              Chess42 is not intended for children below the minimum age
              required by applicable law.
            </p>

            <p className="mt-3">
              If we learn that we have collected personal information from a
              child without the required parental or guardian consent, we will
              take reasonable steps to delete that information.
            </p>

            <p className="mt-3">
              If you believe that a child has provided personal information to
              Chess42 without appropriate consent, please contact us.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">14. Data Security</h3>

            <p>
              We use reasonable technical and organizational measures designed
              to protect personal information against unauthorized access, loss,
              misuse, alteration, or disclosure.
            </p>

            <p className="mt-3">
              However, no online service can guarantee absolute security.
            </p>

            <p className="mt-3">
              You are responsible for maintaining the confidentiality of your
              account credentials and should notify us if you believe that your
              account has been compromised.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              15. Third-Party Services and Links
            </h3>

            <p>
              Chess42 may contain links to third-party websites or services.
            </p>

            <p className="mt-3">
              We are not responsible for the privacy practices, content, or
              security of third-party services.
            </p>

            <p className="mt-3">
              We encourage you to review the privacy policies of any third-party
              services you use.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">
              16. Changes to This Privacy Policy
            </h3>

            <p>We may update this Privacy Policy from time to time.</p>

            <p className="mt-3">
              When we make material changes, we may notify you through the
              Chess42 platform, by email, or through another appropriate method.
            </p>

            <p className="mt-3">
              The "Last updated" date at the top of this Privacy Policy
              indicates when this Privacy Policy was most recently updated.
            </p>

            <p className="mt-3">
              Your continued use of Chess42 after an updated Privacy Policy
              becomes effective means that you acknowledge the updated policy,
              to the extent permitted by applicable law.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">17. Contact Us</h3>

            <p>
              If you have questions about this Privacy Policy or wish to
              exercise your privacy rights, please contact us:
            </p>

            <p className="mt-3">
              <strong>Chess42</strong>
              <br />
              Email:{" "}
              <a
                href="mailto:privacy@chess42.example"
                className="text-blue-500 hover:underline"
              >
                privacy@chess42.com
              </a>
            </p>

            <p className="mt-3">
              If you have questions regarding how your personal information is
              processed, you may contact us using the information above.
            </p>
          </section>

          <div className="pt-4 border-t border-neutral-900">
            <p className="text-neutral-500 text-xs">End of Privacy Policy</p>
          </div>
        </div>

        <div className="mt-8">
          <Link to="/" className="text-gray-500 hover:underline text-sm">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
