import ContentCard from './Card';

const ContentProps = {
    title: 'metaphysical',
    type: 'word',
    icon: 'sdfasdf',
    content: 'Labore pariatur aliqua aliquip exercitation adipisicing mollit et nostrud.',
    metadata: 'Labore pariatur aliqua aliquip exercitation adipisicing mollit et nostrud.',
};

export default function CardGrid() {
    return (
        <div className="flex flex-col">
            <ContentCard {...ContentProps} />
            <ContentCard {...ContentProps} />
            <ContentCard {...ContentProps} />
            <ContentCard {...ContentProps} />
        </div>
    );
}
