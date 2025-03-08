import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-base text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/design-system" className="text-base text-gray-600 hover:text-gray-900">
                  Design Systems
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-base text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/docs" className="text-base text-gray-600 hover:text-gray-900">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-base text-gray-600 hover:text-gray-900">
                  API
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-base text-gray-600 hover:text-gray-900">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-base text-gray-600 hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-base text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-base text-gray-600 hover:text-gray-900">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy" className="text-base text-gray-600 hover:text-gray-900">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-base text-gray-600 hover:text-gray-900">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-base text-gray-500">
            &copy; {new Date().getFullYear()} Figma AI UI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}