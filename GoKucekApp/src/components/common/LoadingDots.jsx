export default function LoadingDots({
    fullscreen = true,
    size = "w-3 h-3",
    colors = ["bg-blue-500", "bg-green-500", "bg-purple-500"],
}) {
    const Wrapper = ({ children }) =>
        fullscreen ? (
            <div className="h-screen flex items-center justify-center bg-slate-100">
                {children}
            </div>
        ) : (
            children
        );

    return (
        <Wrapper>
            <div className="flex space-x-2">
                {colors.map((color, index) => (
                    <div
                        key={index}
                        className={`${size} ${color} rounded-full animate-bounce`}
                        style={{
                            animationDelay: `${index * -0.15}s`,
                        }}
                    />
                ))}
            </div>
        </Wrapper>
    );
}
