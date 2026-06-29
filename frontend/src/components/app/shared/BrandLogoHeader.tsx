export function BrandLogoHeader({
    logo,
    alt,
    fallback,
}: {
    logo: string | null;
    alt: string;
    fallback: string;
}) {
    return (
        <div className="mx-auto mb-4 flex h-20 w-full max-w-[15rem] items-center justify-center">
            {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={logo}
                    alt={alt}
                    className="max-h-17.5 max-w-full object-contain drop-shadow-md"
                />
            ) : (
                <h2 className="text-center text-lg font-medium">{fallback}</h2>
            )}
        </div>
    );
}
