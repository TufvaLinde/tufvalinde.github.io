module Jekyll
  class BuildDrafts < Generator
    safe true
    priority :low

    def generate(site)
      drafts_dir = File.join(site.source, "_drafts")
      return unless Dir.exist?(drafts_dir)

      Dir.glob(File.join(drafts_dir, "**", "*.md")).each do |file|
        next unless File.file?(file)

        relative_path = Pathname.new(file).relative_path_from(Pathname.new(site.source)).to_s
        draft = Jekyll::Document.new(relative_path, site: site, collection: site.posts)
        draft.data["draft"] = true

        next unless draft.data["title"] && !draft.content.strip.empty?

        site.posts.docs << draft
      end
    end
  end
end