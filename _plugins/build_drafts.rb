# _plugins/build_drafts.rb
module Jekyll
  class BuildDrafts < Generator
    safe true
    priority :low

    def generate(site)
      drafts_dir = File.join(site.source, "_drafts")
      return unless Dir.exist?(drafts_dir)

      Dir.glob(File.join(drafts_dir, "**", "*.*")) do |file|
        next unless File.file?(file)
        relative_path = File.join("_drafts", File.basename(file))

        draft = Jekyll::Document.new(relative_path, { site: site, collection: site.posts })
        draft.data["draft"] = true
        site.posts.docs << draft
      end
    end
  end
end