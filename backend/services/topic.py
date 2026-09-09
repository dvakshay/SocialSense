from sklearn.feature_extraction.text import TfidfVectorizer


def extract_topics(texts, top_n=5):

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=100
    )

    matrix = vectorizer.fit_transform(texts)

    scores = matrix.sum(axis=0).A1

    words = vectorizer.get_feature_names_out()

    ranked_words = sorted(
        zip(words, scores),
        key=lambda x: x[1],
        reverse=True
    )

    return [word for word, score in ranked_words[:top_n]]